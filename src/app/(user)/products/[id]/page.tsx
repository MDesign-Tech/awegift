import Container from "@/components/Container";
import { ProductType } from "../../../../../type";
import AddToCartButton from "@/components/AddToCartButton";
import { DataFetchError, getData } from "@/app/(user)/helpers";
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
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/seo";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const product: ProductType = await getData(`/api/products/${id}`);
    const title = `${product.title} | AweGift`;
    const description = product.description || product.title;
    const image = product.images?.[0] || product.thumbnail || undefined;
    return generateSEO({
      title,
      description,
      image,
      url: `/products/${id}`,
    });
  } catch (error) {
    return generateSEO({
      title: "Product | AweGift",
      description: "View product information from AweGift.",
      url: `/products/${id}`,
      noindex: true,
    });
  }
}

const SingleProductPage = async ({ params }: Props) => {
  const { id } = await params;
  let product: ProductType;
  try {
    product = await getData(`/api/products/${id}`);
  } catch (error) {
    if (error instanceof DataFetchError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  // Fetch related products for the same category
  const allProductsData = await getData(`/api/products?limit=0`);
  const allProducts: ProductType[] = allProductsData.products || [];

  const regularPrice = product?.price;
  const productUrl = `${SITE_URL}/products/${encodeURIComponent(id)}`;
  const productImages = [
    product.thumbnail,
    ...(product.images || []),
  ].filter((image, index, images): image is string =>
    Boolean(image) && images.indexOf(image) === index
  );
  const offer =
    typeof product.price === "number" && Number.isFinite(product.price)
      ? {
          "@type": "Offer",
          url: productUrl,
          price: product.price,
          ...(product.currency ? { priceCurrency: product.currency } : {}),
          ...(product.isUnlimitedStock === true ||
          (typeof product.stock === "number" && product.stock > 0)
            ? { availability: "https://schema.org/InStock" }
            : typeof product.stock === "number"
              ? { availability: "https://schema.org/OutOfStock" }
              : {}),
        }
      : undefined;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        url: productUrl,
        name: product.title,
        ...(product.description ? { description: product.description } : {}),
        ...(productImages.length ? { image: productImages } : {}),
        ...(product.sku ? { sku: product.sku } : {}),
        ...(product.brand
          ? { brand: { "@type": "Brand", name: product.brand } }
          : {}),
        ...(product.categories?.length
          ? { category: product.categories.join(", ") }
          : {}),
        ...(offer ? { offers: offer } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: "Products",
            item: `${SITE_URL}/products`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.title,
            item: productUrl,
          },
        ],
      },
    ],
  };

  return (
    <div>
      <JsonLd data={structuredData} />
      <Container className="flex flex-col gap-10 py-10  border-1 rounded-xl mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Image */}
          <ProductImages 
            images={product?.images}
            thumbsail={product?.thumbnail}
            productName={product.title}
          />
          {/* Product Details */}
          <div className="flex flex-col gap-4 ">
            <h1 className="text-3xl font-bold">{product?.title}</h1>
            <div className="flex items-center justify-between">
              <ProductPrice regularPrice={regularPrice} product={product} />
              {/* Client actions: favorite, copy link */}
              <ProductActionsClient product={product} />
            </div>
            <div>
              <p className="text-sm tracking-wide">{product?.description}</p>
              <p className="text-base">{product?.warrantyInformation}</p>
            </div>
            {/* <p>
              <span className="font-bold">Brand:</span> <span className="font-medium">{product?.brand}</span>
            </p> */}
            <p>
              <span className="font-bold">Categories: </span> 
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

            {/* <div className="bg-[#f7f7f7] p-5 rounded-md flex flex-col items-center justify-center gap-2">
              <img
                src={paymentImage.src}
                alt="payment"
                className="w-auto object-cover"
              />
              <p className="font-semibold">Guaranteed safe & secure checkout</p>
            </div> */}
          </div>
        </div>

        {/* Product Specifications */}
        {/* <div className="w-full">
          <ProductSpecifications product={product} />
        </div> */}
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
