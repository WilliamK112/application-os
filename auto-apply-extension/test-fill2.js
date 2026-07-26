var fields = {
  'input[name="regionSubdivision1"]': 'Wisconsin',
  'input[name="phoneNumber"]': '3478668326'
};
var filled = 0;
for (var sel in fields) {
  var el = document.querySelector(sel);
  if (el) {
    el.value = fields[sel];
    el.dispatchEvent(new Event("input", {bubbles:true}));
    el.dispatchEvent(new Event("change", {bubbles:true}));
    filled++;
  }
}
"Done: " + filled + " fields";