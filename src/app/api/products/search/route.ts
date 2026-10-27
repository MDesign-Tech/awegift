import { NextRequest } from "next/server";
import { GET as getProducts } from "../route";

export async function GET(request: NextRequest) {
  return getProducts(request);
}
