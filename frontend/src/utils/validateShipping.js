export function validateShipping(address) {
  const errors = {};
  const fullName = address.fullName?.trim() || "";
  const phone = address.phone?.trim() || "";
  const addressLine1 = address.addressLine1?.trim() || "";
  const city = address.city?.trim() || "";
  const state = address.state?.trim() || "";
  const pincode = address.pincode?.trim() || "";

  if (!fullName) errors.fullName = "Full name is required.";
  if (!phone) errors.phone = "Phone number is required.";
  else if (!/^[6-9]\d{9}$/.test(phone)) errors.phone = "Phone must be a 10-digit mobile number.";
  if (!addressLine1) errors.addressLine1 = "Address is required.";
  if (!city) errors.city = "City is required.";
  if (!state) errors.state = "State is required.";
  if (!pincode) errors.pincode = "Pincode is required.";
  else if (!/^\d{6}$/.test(pincode)) errors.pincode = "Pincode must contain 6 digits.";

  return errors;
}
