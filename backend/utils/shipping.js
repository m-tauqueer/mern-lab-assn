const readShippingAddress = (body) => {
  const address = body?.shippingAddress || {};
  const fullName = typeof address.fullName === "string" ? address.fullName.trim() : "";
  const phone = typeof address.phone === "string" ? address.phone.trim() : "";
  const addressLine1 = typeof address.addressLine1 === "string" ? address.addressLine1.trim() : "";
  const city = typeof address.city === "string" ? address.city.trim() : "";
  const state = typeof address.state === "string" ? address.state.trim() : "";
  const pincode = typeof address.pincode === "string" ? address.pincode.trim() : "";

  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
    return { error: "All shipping fields are required" };
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    return { error: "Phone must be a 10-digit mobile number" };
  }

  if (!/^\d{6}$/.test(pincode)) {
    return { error: "Pincode must contain 6 digits" };
  }

  return {
    value: { fullName, phone, addressLine1, city, state, pincode },
  };
};

module.exports = { readShippingAddress };
