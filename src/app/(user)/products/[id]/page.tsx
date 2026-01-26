import Container from "@/components/Container";
import { ProductType } from "../../../../../type";
import AddToCartButton from "@/components/AddToCartButton";
import { getData } from "@/app/(user)/helpers";
import ProductImages from "@/components/ProductImages";
import PriceFormat from "@/components/PriceFormat";
import { paymentImage } from "@/assets";
import { MdStar } from "react-icons/md";
import ProductPrice from "@/components/ProductPrice";
import ProductFeatures from "@/components/ProductFeatures";
import ProductSpecifications from "@/components/ProductSpecifications";
import RelatedProducts from "@/components/RelatedProducts";
import ProductActionsClient from "@/components/ProductActionsClient";
import { notFound } from "next/navigation";
import { generateSEO } from "@/lib/seo";
import type { Metadata } from "next";

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const product: ProductType = await getData(`/api/products/${id}`);
    const title = `${product.title} | ${product.brand}`;
    const description = product.description || product.title;
    const image = product.images?.[0] || undefined;
    return generateSEO({
      title,
      description,
      image,
      url: `/products/${id}`,
    });
  } catch (error) {
    return generateSEO({
      title: "Product Not Found",
      description: "The product you are looking for could not be found.",
      url: `/products/${id}`,
    });
  }
}

const SingleProductPage = async ({ params }: Props) => {
  const { id } = await params;
  let product: ProductType;
  try {
    product = await getData(`/api/products/${id}`);
  } catch (error: any) {
    if (error.status === 404) {
      notFound();
    }
    throw error;
  }

  // Fetch related products for the same category
  const allProductsData = await getData(`/api/products?limit=0`);
  const allProducts: ProductType[] = allProductsData.products || [];

  const regularPrice = product?.price;

  return (
    <div>
      <Container className="flex flex-col gap-10 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Image */}
          <ProductImages
            images={product?.images}
            thumbsail={product?.thumbnail}
          />
          {/* Product Details */}
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold">{product?.title}</h2>
            <div className="flex items-center justify-between">
              <ProductPrice regularPrice={regularPrice} product={product} />
              {/* Client actions: favorite, copy link */}
              <ProductActionsClient product={product} />
            </div>
            <div>
              <p className="text-sm tracking-wide">{product?.description}</p>
              <p className="text-base">{product?.warrantyInformation}</p>
            </div>
            <p>
              <span className="font-bold">Brand:</span> <span className="font-medium">{product?.brand}</span>
            </p>
            <p>
              <span className="font-bold">Categories:</span> 
              <span className="font-medium capitalize">
                {product?.categories && product.categories.length > 0
                  ? product.categories.join(", ")
                  : "No category"}
              </span>
            </p>

            <AddToCartButton
              product={product}
              className=" rounded-md uppercase font-semibold"
            />

            <div className="bg-[#f7f7f7] p-5 rounded-md flex flex-col items-center justify-center gap-2">
              <img
                src={paymentImage.src}
                alt="payment"
                className="w-auto object-cover"
              />
              <p className="font-semibold">Guaranteed safe & secure checkout</p>
            </div>
          </div>
        </div>

        {/* Product Specifications */}
        <div className="w-full">
          <ProductSpecifications product={product} />
        </div>
      </Container>

      {/* Product Features Section */}
      <Container>
        <ProductFeatures />
      </Container>

      {/* Related Products Section */}
      <Container>
        <RelatedProducts
          products={allProducts}
          currentProductId={product?.id}
          category={
            product?.categories && product.categories.length > 0
              ? product.categories[0]
              : ""
          }
        />
      </Container>
    </div>
  );
};

export default SingleProductPage;
