import axios from "axios";
import { baseApiUrl } from "../utils/apiUtils";

export const createGuestCart = async () => {
  try {
    const response = await axios.post(baseApiUrl + "/rest/V1/guest-carts");
    return response.data;
  } catch (e) {
    console.error("Error creating guest cart: ", e);
    throw e;
  }
};
