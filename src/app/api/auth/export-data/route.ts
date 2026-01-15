import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import puppeteer from "puppeteer";
import { OrderData, QuotationType } from "@/../../type";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user data
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Get user's orders
    const ordersSnapshot = await adminDb
      .collection("orders")
      .where("userId", "==", userId)
      .get();

    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get user's quotes
    const quotesSnapshot = await adminDb
      .collection("quotations")
      .where("userId", "==", userId)
      .get();

    const quotes = quotesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Compile data
    const exportData = {
      user: {
        id: userData?.id,
        name: userData?.name,
        email: userData?.email,
        role: userData?.role,
        profile: userData?.profile,
        preferences: userData?.preferences,
        createdAt: userData?.createdAt,
        updatedAt: userData?.updatedAt,
      },
      orders,
      quotes,
      exportedAt: new Date().toISOString(),
    };

    // Generate PDF with user data
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Create HTML content for the PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>AweGift Account Data Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #ed4c07; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #ed4c07; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            .data-item { margin-bottom: 10px; padding: 10px; background: #f9f9f9; border-radius: 5px; }
            .label { font-weight: bold; color: #333; }
            .value { color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #ed4c07; color: white; }
            .export-info { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AweGift Account Data Export</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h2>User Profile</h2>
            <div class="data-item">
              <div class="label">Name:</div>
              <div class="value">${exportData.user.name}</div>
            </div>
            <div class="data-item">
              <div class="label">Email:</div>
              <div class="value">${exportData.user.email}</div>
            </div>
            <div class="data-item">
              <div class="label">Role:</div>
              <div class="value">${exportData.user.role}</div>
            </div>
            <div class="data-item">
              <div class="label">Member Since:</div>
              <div class="value">${new Date(exportData.user.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          ${exportData.orders.length > 0 ? `
          <div class="section">
            <h2>Order History (${exportData.orders.length} orders)</h2>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Status</th>
                  <th>Total Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${exportData.orders.map((order: any) => `
                  <tr>
                    <td>${order.id}</td>
                    <td>${order.status}</td>
                    <td>$${order.totalAmount}</td>
                    <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : '<div class="section"><h2>Order History</h2><p>No orders found.</p></div>'}

          ${exportData.quotes.length > 0 ? `
          <div class="section">
            <h2>Quote History (${exportData.quotes.length} quotes)</h2>
            <table>
              <thead>
                <tr>
                  <th>Quote ID</th>
                  <th>Status</th>
                  <th>Final Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${exportData.quotes.map((quote: any) => `
                  <tr>
                    <td>${quote.id}</td>
                    <td>${quote.status}</td>
                    <td>$${quote.finalAmount || 'N/A'}</td>
                    <td>${new Date(quote.createdAt).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : '<div class="section"><h2>Quote History</h2><p>No quotes found.</p></div>'}

          <div class="export-info">
            <p>This document contains your complete account data from AweGift.</p>
            <p>Exported on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="awegift-data-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Export data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}