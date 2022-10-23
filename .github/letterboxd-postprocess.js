// Step 1: Read the downloaded_filename JSON
const filename = Deno.args[0]; // Same name as downloaded_filename `const filename = 'btc-price.json';`
const destination = "_data/films.yaml";

import { parseFeed } from "https://deno.land/x/rss/mod.ts";
import { load, dump } from "https://deno.land/x/js_yaml_port@3.14.0/js-yaml.js";
import {
  uniqWith,
  isEqual,
  merge,
} from "https://deno.land/x/lodash@4.17.15-es/lodash.js";import { ensureDir } from "https://deno.land/std@0.160.0/fs/mod.ts";
import { dirname } from "https://deno.land/std@0.160.0/path/posix.ts";

const xml = await Deno.readTextFile(filename);
const { entries } = await parseFeed(xml);

/*
{
  "letterboxd:watcheddate": { value: "2020-04-07" },
  "letterboxd:rewatch": { value: "Yes" },
  "letterboxd:filmtitle": { value: "Coffee and Cigarettes" },
  "letterboxd:filmyear": { value: "2003" },
  "letterboxd:memberrating": { value: "4.0" },
  "dc:creator": [ "Aron" ],
  id: "letterboxd-watch-120981993",
  title: { value: "Coffee and Cigarettes, 2003 - ★★★★", type: undefined },
  description: {
    value: '<p><img src="https://a.ltrbxd.com/resized/film-poster/5/1/2/6/9/51269-coffee-and-cigarettes-0-600-0-...
',
    type: undefined
  },
  comments: undefined,
  published: 2020-08-25T16:30:54.000Z,
  publishedRaw: "Wed, 26 Aug 2020 04:30:54 +1200",
  updated: 2020-08-25T16:30:54.000Z,
  updatedRaw: "Wed, 26 Aug 2020 04:30:54 +1200",
  author: { email: undefined, name: "Aron", uri: undefined },
  links: [ { href: "https://letterboxd.com/aron/film/coffee-and-cigarettes-2003/" } ],
  categories: undefined,
  contributors: undefined
}
  */
const films = entries
  .filter((entry) => entry["letterboxd:watcheddate"])
  .map((entry) => {
    console.log(entry["letterboxd:memberrating"]);
    return {
      title: entry["letterboxd:filmtitle"]?.value ?? "",
      year: entry["letterboxd:filmyear"]?.value ?? "",
      rating: entry["letterboxd:memberrating"]?.value ?? "",
      watched_at: entry["letterboxd:watcheddate"].value,
      link: entry.links[0]?.href,
    };
  });

await ensureDir(dirname(destination));

let current;
try {
  current = load(await Deno.readTextFile(destination));
} catch (err) {
  current = {items: []};
}

const merged = uniqWith(merge(current.items, films), isEqual);
merged.sort(
  (a, b) => Date.parse(b.watched_at) - Date.parse(a.watched_at)
);

await Deno.writeTextFile(destination, dump({items: merged}));
await Deno.remove(filename);
