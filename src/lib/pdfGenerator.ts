import puppeteer from "puppeteer";
import { OrderData, UserData } from "@/../../type";

export async function generateReceiptPdf(
  order: OrderData,
  user: UserData
): Promise<Buffer> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();

    // Generate HTML content
    const htmlContent = generateReceiptHtml(order, user);

    // FIX 1: Use "load" instead of "networkidle0" to avoid timeouts if images/fonts fail
    // FIX 2: We use setContent but provide a dummy path or bypass if images are local
    await page.setContent(htmlContent, { waitUntil: "load", timeout: 10000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

function generateReceiptHtml(order: OrderData, user: UserData): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = order.deliveryFee || 0;
  const discount = order.discount || 0;
  const grandTotal = subtotal + deliveryFee - discount;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AweGift Receipt - Order ${order.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Plus Jakarta Sans', 'Helvetica', 'Arial', sans-serif;
          color: #101828;
          line-height: 1.6;
          background: #ffffff;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px 15px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        /* Header */
        .header {
          text-align: center;
          border-bottom: 2px solid #ed4c07;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #ed4c07;
          margin-bottom: 4px;
        }
        .tagline {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        /* Receipt Info */
        .receipt-header {
          background: linear-gradient(135deg, #fff6f1 0%, #fef3f2 100%);
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #fed7d7;
        }
        .receipt-details {
          margin-bottom: 15px;
        }
        .receipt-details h3 {
          font-size: 18px;
          font-weight: 700;
          color: #ed4c07;
          margin-bottom: 6px;
        }
        .receipt-details p {
          color: #374151;
          font-size: 12px;
          margin-bottom: 3px;
        }
        .customer-info h4 {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 6px;
        }
        .customer-info p {
          color: #6b7280;
          font-size: 12px;
          margin-bottom: 2px;
        }

        /* Order Details */
        .order-section {
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 1px solid #e5e7eb;
        }

        .order-meta {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-bottom: 15px;
        }
        .meta-item {
          background: #f9fafb;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .meta-label {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .meta-value {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        /* Items Table */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .items-table thead {
          background: linear-gradient(135deg, #ed4c07 0%, #ff6b2c 100%);
          color: white;
        }
        .items-table th {
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .items-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }
        .item-name {
          font-weight: 600;
          color: #111827;
          margin-bottom: 2px;
          font-size: 13px;
        }
        .item-sku {
          font-size: 11px;
          color: #6b7280;
        }
        .item-quantity {
          font-weight: 600;
          color: #374151;
          font-size: 13px;
        }
        .item-price {
          font-weight: 600;
          color: #059669;
          font-size: 13px;
        }
        .item-total {
          font-weight: 700;
          color: #ed4c07;
          font-size: 13px;
        }

        /* Totals */
        .totals-section {
          background: #f9fafb;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          border: 1px solid #e5e7eb;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .totals-row:last-child {
          border-bottom: none;
          border-top: 2px solid #ed4c07;
          padding-top: 10px;
          margin-top: 5px;
        }
        .totals-label {
          font-size: 12px;
          color: #6b7280;
        }
        .totals-value {
          font-size: 12px;
          font-weight: 600;
          color: #111827;
        }
        .grand-total .totals-label {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }
        .grand-total .totals-value {
          font-size: 16px;
          font-weight: 800;
          color: #ed4c07;
        }

        /* Payment Info */
        .payment-info {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 20px;
        }
        .payment-title {
          font-size: 14px;
          font-weight: 700;
          color: #065f46;
          margin-bottom: 8px;
        }
        .payment-details {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        .payment-item {
          background: rgba(255, 255, 255, 0.8);
          padding: 8px;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .payment-label {
          font-size: 11px;
          font-weight: 600;
          color: #047857;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .payment-value {
          font-size: 12px;
          font-weight: 600;
          color: #065f46;
        }

        /* Footer */
        .footer {
          text-align: center;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
        }
        .footer-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        .footer-section h5 {
          font-size: 12px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 4px;
        }
        .footer-section p {
          font-size: 11px;
          line-height: 1.4;
          margin-bottom: 2px;
        }
        .copyright {
          font-size: 10px;
          color: #9ca3af;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }

        /* Status Badge */
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-completed {
          background: #d1fae5;
          color: #065f46;
        }
        .status-paid {
          background: #dbeafe;
          color: #1e40af;
        }

        @media print {
          body { background: white; }
          .container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo">AweGift</div>
          <div class="tagline">Your Trusted Shopping Partner</div>
        </div>

        <!-- Receipt Header -->
        <div class="receipt-header">
          <div class="receipt-details">
            <h3>Payment Receipt</h3>
            <p><strong>Receipt #:</strong> RCP-${order.id.slice(-8).toUpperCase()}</p>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Issue Date:</strong> ${formatDate(order.createdAt)}</p>
            ${order.completedAt ? `<p><strong>Completed:</strong> ${formatDate(order.completedAt)}</p>` : ''}
          </div>
          <div class="customer-info">
            <h4>Bill To</h4>
            <p><strong>${user.profile?.firstName || ''} ${user.profile?.lastName || ''}</strong></p>
            <p>${user.email}</p>
            ${user.profile?.phone ? `<p>${user.profile.phone}</p>` : ''}
            ${order.orderAddress ? `<p>${order.orderAddress}</p>` : ''}
          </div>
        </div>

        <!-- Order Details -->
        <div class="order-section">
          <h3 class="section-title">Order Details</h3>

          <div class="order-meta">
            <div class="meta-item">
              <div class="meta-label">Order Status</div>
              <div class="meta-value">
                <span class="status-badge status-completed">${order.status}</span>
              </div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Payment Status</div>
              <div class="meta-value">
                <span class="status-badge status-paid">${order.paymentStatus}</span>
              </div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Payment Method</div>
              <div class="meta-value">${order.paymentMethod?.toUpperCase() || 'N/A'}</div>
            </div>
            ${order.confirmedAt ? `
            <div class="meta-item">
              <div class="meta-label">Confirmed</div>
              <div class="meta-value">${formatDate(order.confirmedAt)}</div>
            </div>
            ` : ''}
            ${order.readyAt ? `
            <div class="meta-item">
              <div class="meta-label">Ready</div>
              <div class="meta-value">${formatDate(order.readyAt)}</div>
            </div>
            ` : ''}
          </div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>
                    <div class="item-name">${item.title}</div>
                    ${item.sku ? `<div class="item-sku">SKU: ${item.sku}</div>` : ''}
                  </td>
                  <td>${item.sku || ''}</td>
                  <td style="text-align: center;">
                    <span class="item-quantity">${item.quantity}</span>
                  </td>
                  <td style="text-align: right;">
                    <span class="item-price">${formatCurrency(item.price)}</span>
                  </td>
                  <td style="text-align: right;">
                    <span class="item-total">${formatCurrency(item.price * item.quantity)}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Totals -->
          <div class="totals-section">
            <div class="totals-row">
              <span class="totals-label">Subtotal</span>
              <span class="totals-value">${formatCurrency(subtotal)}</span>
            </div>
            ${deliveryFee > 0 ? `
            <div class="totals-row">
              <span class="totals-label">Delivery Fee</span>
              <span class="totals-value">${formatCurrency(deliveryFee)}</span>
            </div>
            ` : ''}
            ${discount > 0 ? `
            <div class="totals-row">
              <span class="totals-label">Discount</span>
              <span class="totals-value">-${formatCurrency(discount)}</span>
            </div>
            ` : ''}
            <div class="totals-row grand-total">
              <span class="totals-label">Grand Total</span>
              <span class="totals-value">${formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <!-- Payment Information -->
          <div class="payment-info">
            <div class="payment-title">💳 Payment Information</div>
            <div class="payment-details">
              <div class="payment-item">
                <div class="payment-label">Method</div>
                <div class="payment-value">${order.paymentMethod?.toUpperCase() || 'N/A'}</div>
              </div>
              <div class="payment-item">
                <div class="payment-label">Status</div>
                <div class="payment-value">${order.paymentStatus}</div>
              </div>
              <div class="payment-item">
                <div class="payment-label">Amount Paid</div>
                <div class="payment-value">${formatCurrency(grandTotal)}</div>
              </div>
              <div class="payment-item">
                <div class="payment-label">Transaction Date</div>
                <div class="payment-value">${formatDate(order.createdAt)}</div>
              </div>
            </div>
          </div>

          ${order.notes ? `
          <div class="order-section">
            <h3 class="section-title">Order Notes</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="color: #374151; font-style: italic;">${order.notes}</p>
            </div>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-content">
            <div class="footer-section">
              <h5>Need Help?</h5>
              <p>📧 support@awegift.com</p>
              <p>📱 +250 781 990 310</p>
              <p>🌐 www.awegift.com</p>
            </div>
            <div class="footer-section">
              <h5>Thank You!</h5>
              <p>Your business means the world to us.</p>
              <p>We hope to see you again soon!</p>
            </div>
          </div>
          <div class="copyright">
            <p>&copy; ${new Date().getFullYear()} AweGift. All rights reserved.</p>
            <p>This is an official receipt generated electronically.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}