"use client";
import React, { useEffect, useState } from "react";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import { addToFavorite } from "@/redux/shofySlice";
import toast from "react-hot-toast";
import { ProductType, StateType } from "../../type";

interface Props {
  product: ProductType;
}

export default function ProductActionsClient({ product }: Props) {
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const { favorite } = useSelector((state: StateType) => state?.aweGift || { favorite: [] });
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (session?.user) {
      const found = favorite?.some((item: any) => item.id === product.id);
      setIsFavorite(!!found);
    }
  }, [favorite, product.id, session?.user]);

  const handleFavoriteClick = () => {
    if (session?.user) {
      dispatch(addToFavorite(product));
      if (isFavorite) {
        toast.success("Removed from favorites");
      } else {
        toast.success("Added to favorites");
      }
    } else {
      toast.error("Please login to add to favorites");
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleFavoriteClick}
        className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow hover:bg-red-50 hover:text-red-500 transition-all duration-200"
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavorite ? (
          <MdFavorite className="w-5 h-5 text-red-500" />
        ) : (
          <MdFavoriteBorder className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
