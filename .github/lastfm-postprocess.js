// Step 1: Read the downloaded_filename JSON
const filename = Deno.args[0]; // Same name as downloaded_filename `const filename = 'btc-price.json';`
const destination = "_data/music.yaml";

import { load, dump } from "https://deno.land/x/js_yaml_port@3.14.0/js-yaml.js";
import {
  uniqWith,
  isEqual,
  merge,
} from "https://deno.land/x/lodash@4.17.15-es/lodash.js";
import { ensureDir } from "https://deno.land/std@0.160.0/fs/mod.ts";
import { dirname } from "https://deno.land/std@0.160.0/path/posix.ts";

const data = await Deno.readTextFile(filename);
const { recenttracks } = await JSON.parse(data);

/*
{
  artist: { mbid: "3f542031-b054-454d-b57b-812fa2a81b11", "#text": "Yo La Tengo" },
  streamable: "0",
  image: [
    {
      size: "small",
      "#text": "https://lastfm.freetls.fastly.net/i/u/34s/307dfc34b0c14f93ac6b5f4548ae2464.jpg"
    },
    {
      size: "medium",
      "#text": "https://lastfm.freetls.fastly.net/i/u/64s/307dfc34b0c14f93ac6b5f4548ae2464.jpg"
    },
    {
      size: "large",
      "#text": "https://lastfm.freetls.fastly.net/i/u/174s/307dfc34b0c14f93ac6b5f4548ae2464.jpg"
    },
    {
      size: "extralarge",
      "#text": "https://lastfm.freetls.fastly.net/i/u/300x300/307dfc34b0c14f93ac6b5f4548ae2464.jpg"
    }
  ],
  mbid: "5229822f-617f-42bc-8fc4-e63e9d22a3a3",
  album: { mbid: "2e80d3a0-87db-4d7f-a10b-a5939b4b859e", "#text": "Electr-o-pura" },
  name: "Tom Courtenay",
  url: "https://www.last.fm/music/Yo+La+Tengo/_/Tom+Courtenay",
  date: { uts: "1666008599", "#text": "17 Oct 2022, 12:09" }
}
  */
const tracks = recenttracks.track
.filter(entry => entry.date)
.map(entry => {
  return {
    title: entry.name,
    album: entry.album["#text"],
    artist: entry.artist["#text"],
    timestamp: entry.date["#text"],
    link: entry.url,
  };
});

await ensureDir(dirname(destination));

let current;
try {
  current = load(await Deno.readTextFile(destination));
} catch (err) {
  current = { items: [] };
}

const merged = uniqWith(merge(current.items, tracks), isEqual);
merged.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

const filedata = { items: merged };

await Deno.writeTextFile(destination, dump(filedata));
await Deno.remove(filename);
