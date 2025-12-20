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

interface Props {
  params: {
    id: string;
  };
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
  console.log("Product Data:", product);

  // Fetch related products for the same category
  const allProductsData = await getData(`/api/products?limit=0`);
  const allProducts: ProductType[] = allProductsData.products || [];

  const regularPrice = product?.price;

  return (
    <div>
      <Container className="grid grid-cols-1 md:grid-cols-2 gap-10 py-10">
        {/* Product Image */}
        <ProductImages images={product?.images} thumbsail={product?.thumbnail} />
        {/* Product Details */} 
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-bold">{product?.title}</h2>
          <div className="flex items-center justify-between">
            <ProductPrice
              regularPrice={regularPrice}
              product={product}
            />
            {/* Client actions: favorite, copy link */}
            <ProductActionsClient product={product} />
            
          </div>
          <div>
            <p className="text-sm tracking-wide">{product?.description}</p>
            <p className="text-base">{product?.warrantyInformation}</p>
          </div>
          <p>
            Brand: <span className="font-medium">{product?.brand}</span>
          </p>
          <p>
            Category:{" "}
            <span className="font-medium capitalize">{product?.categories && product.categories.length > 0 ? product.categories.join(", ") : "No category"}</span>
          </p>
          <p>
            Tags:{" "}
            {product?.tags?.map((item, index) => (
              <span key={index.toString()} className="font-medium capitalize">
                {item}
                {index < product?.tags?.length - 1 && ", "}
              </span>
            ))}
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

        {/* Product Specifications */}
        <div className="col-span-2">
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
          category={product?.categories && product.categories.length > 0 ? product.categories[0] : ""}
        />
      </Container>
    </div>
  );
};

export default SingleProductPage;
