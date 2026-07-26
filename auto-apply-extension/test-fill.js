const USER_PROFILE = {
  name: "Ching-Wei Kang",
  email: "ckang53@wisc.edu",
  phone: "3478668326",
  address: "432 W Gorham St"
};

const nameParts = USER_PROFILE.name.split(' ');
const firstName = nameParts[0] || '';
const lastName = nameParts.slice(1).join(' ') || '';

const mappings = {
  'input[name="legalName--firstName"]': firstName,
  'input[name="legalName--lastName"]': lastName,
  'input[name="addressLine1"]': USER_PROFILE.address,
  'input[name="city"]': 'Madison',
  'input[name="postalCode"]': '53703',
  'input[name="phoneNumber"]': USER_PROFILE.phone,
  'input[type="email"]': USER_PROFILE.email
};

let filled = 0;
for (const [selector, value] of Object.entries(mappings)) {
  const field = document.querySelector(selector);
  if (field && (!field.value || field.value === '')) {
    field.value = value;
    field.dispatchEvent(new Event('input', {bubbles: true}));
    field.dispatchEvent(new Event('change', {bubbles: true}));
    filled++;
  }
}
"Filled " + filled + " fields";