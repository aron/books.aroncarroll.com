---
---
{% assign latest = site.data.films.items | sort:'watched_at' | last %}
if (typeof getCurrentFilm === 'function') {
  getCurrentFilm({{ latest | jsonify }});
} else {
  throw new Error('Missing callback "getCurrentFilm". This is required for poor mans jsonp.');
}
