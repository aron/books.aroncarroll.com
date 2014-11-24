---
---
{% assign finished = site.data.books.items | where:'state','finished' | sort:'finished_at' | last %}
{% assign reading = site.data.books.items | where:'state','started' | sort:'started_at' | last %}
{% if finished.finished_at > reading.started_at %}
  {% assign latest = finished %}
{% else %}
  {% assign latest = reading %}
{% endif %}
if (typeof getCurrentBook === 'function') {
  getCurrentBook({{ latest | jsonify }});
} else {
  throw new Error('Missing callback "getCurrentBook". This is required for poor mans jsonp.');
}
