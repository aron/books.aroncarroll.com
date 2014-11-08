---
---
if (typeof getAllBooks === 'function') {
  getAllBooks({{ site.data.books | jsonify }});
} else {
  throw new Error('Missing callback "getAllBooks". This is required for poor mans jsonp.');
}
