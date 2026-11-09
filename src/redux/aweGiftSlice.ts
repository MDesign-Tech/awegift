import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ProductType, UserData } from "../../type";
import {
  getProductMinimumOrderQuantity,
  getProductMaximumOrderQuantity,
  isProductAvailable,
  isValidProductQuantity,
} from "@/lib/productLimits";

interface InitialState {
  cart: ProductType[];
  favorite: ProductType[];
  userInfo: UserData | null;
}

const initialState: InitialState = {
  cart: [],
  favorite: [],
  userInfo: null,
};

export const aweGiftSlice = createSlice({
  name: "AweGift",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload as ProductType;
      if (!isProductAvailable(product)) return;
      const existingProduct = state?.cart?.find(
        (item) => item?.id === product?.id
      );
      if (existingProduct) {
        const nextQuantity = (existingProduct.quantity || 0) + 1;
        const maximum = getProductMaximumOrderQuantity(existingProduct);
        if (
          Number.isSafeInteger(nextQuantity) &&
          nextQuantity <= maximum
        ) {
          existingProduct.quantity = nextQuantity;
        }
      } else {
        const quantity = getProductMinimumOrderQuantity(product);
        if (isValidProductQuantity(product, quantity)) {
          state.cart.push({ ...product, quantity });
        }
      }
    },
    increaseQuantity: (state, action) => {
      const existingProduct = state?.cart?.find(
        (item) => item?.id === action.payload
      );
      if (existingProduct) {
        const nextQuantity = (existingProduct.quantity || 0) + 1;
        const maximum = getProductMaximumOrderQuantity(existingProduct);
        if (
          Number.isSafeInteger(nextQuantity) &&
          nextQuantity <= maximum
        ) {
          existingProduct.quantity = nextQuantity;
        }
      }
    },
    decreaseQuantity: (state, action) => {
      const existingProduct = state?.cart?.find(
        (item) => item?.id === action.payload
      );
      if (existingProduct) {
        const nextQuantity = (existingProduct.quantity || 0) - 1;
        if (isValidProductQuantity(existingProduct, nextQuantity)) {
          existingProduct.quantity = nextQuantity;
        }
      }
    },
    setQuantity: (state, action: PayloadAction<{
        id: string;
        quantity: number;
      }>) => {
      const { id, quantity } = action.payload;
      const existingProduct = state.cart.find((item) => item.id === id);
      if (existingProduct && isValidProductQuantity(existingProduct, quantity)) {
        existingProduct.quantity = quantity;
      }
    },
    removeFromCart: (state, action) => {
      state.cart = state.cart.filter((item) => item?.id !== action.payload);
    },
    resetCart: (state) => {
      state.cart = [];
    },
    // Favorite cart
    addToFavorite: (state, action) => {
      const existingProduct = state?.favorite?.find(
        (item) => item?.id === action.payload?.id
      );
      if (existingProduct) {
        state.favorite = state.favorite.filter(
          (item) => item?.id !== action.payload.id
        );
      } else {
        state.favorite.push(action.payload);
      }
    },
    resetFavorite: (state) => {
      state.favorite = [];
    },

    addUser: (state, action) => {
      state.userInfo = action.payload;
    },
    updateUser: (state, action) => {
      if (state.userInfo) {
        state.userInfo = { ...state.userInfo, ...action.payload };
      }
    },
    removeUser: (state) => {
      state.userInfo = null;
    },
  },
});
export const {
  addToCart,
  addUser,
  updateUser,
  removeUser,
  increaseQuantity,
  decreaseQuantity,
  setQuantity,
  removeFromCart,
  resetCart,
  addToFavorite,
  resetFavorite,
} = aweGiftSlice.actions;
export default aweGiftSlice.reducer;
