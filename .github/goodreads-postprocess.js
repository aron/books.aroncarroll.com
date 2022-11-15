// Step 1: Read the downloaded_filename JSON
const filename = Deno.args[0]; // Same name as downloaded_filename `const filename = 'btc-price.json';`
const destination = "_data/goodreads.yaml";

import { parseFeed } from "https://deno.land/x/rss/mod.ts";
import { load, dump } from "https://deno.land/x/js_yaml_port@3.14.0/js-yaml.js";
import {
  unionWith,
  isEqual,
} from "https://deno.land/x/lodash@4.17.15-es/lodash.js";
import { ensureDir } from "https://deno.land/std@0.160.0/fs/mod.ts";
import { dirname } from "https://deno.land/std@0.160.0/path/posix.ts";

const xml = await Deno.readTextFile(filename);
const { entries } = await parseFeed(xml);

/*
{
  book_id: { value: "14761514" },
  book_image_url: {
    value: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1349690067l/14761514._SY75_.jp..."
  },
  book_small_image_url: {
    value: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1349690067l/14761514._SY75_.jp..."
  },
  book_medium_image_url: {
    value: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1349690067l/14761514._SX98_.jp..."
  },
  book_large_image_url: {
    value: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1349690067l/14761514.jpg"
  },
  book_description: {
    value: "With this extraordinary first volume in what promises to be an epoch-making masterpiece, Neal Stephe..."
  },
  book: { id: "14761514", num_pages: { value: "931" } },
  author_name: { value: "Neal Stephenson" },
  user_name: { value: "Aron" },
  user_rating: { value: "0" },
  user_date_added: { value: "Tue, 15 Nov 2022 12:22:23 -0800" },
  user_date_created: { value: "Sun, 23 Oct 2022 15:23:29 -0700" },
  user_shelves: { value: "currently-reading" },
  average_rating: { value: "4.24" },
  book_published: { value: "1999" },
  id: "https://www.goodreads.com/review/show/5062918711?utm_medium=api&utm_source=rss",
  title: { value: "Cryptonomicon", type: undefined },
  description: {
    value: '<a href="https://www.goodreads.com/book/show/14761514-cryptonomicon?utm_medium=api&amp;utm_source=rs...',
    type: undefined
  },
  comments: undefined,
  published: 2022-11-15T20:22:23.000Z,
  publishedRaw: "Tue, 15 Nov 2022 12:22:23 -0800",
  updated: 2022-11-15T20:22:23.000Z,
  updatedRaw: "Tue, 15 Nov 2022 12:22:23 -0800",
  links: [
    {
      href: "https://www.goodreads.com/review/show/5062918711?utm_medium=api&utm_source=rss"
    }
  ],
  categories: undefined,
  contributors: undefined
}
 */
const shelvesToStates = {
  "to-read": "queued",
  "currently-reading": "started",
  read: "finished",
};
const books = entries.map((entry) => {
  const [title, ...subtitle] = entry.title.value.split(":");
  const state = entry.user_read_at
    ? "finished"
    : // empty value seems to imply that the book is finished…
      shelvesToStates[entry.user_shelves?.value] ?? "finished";

  const queuedAt = new Date(entry.user_date_created.value)
    .toISOString()
    .split("T")[0];
  const startedAt =
    state === "started" && entry.user_date_added
      ? new Date(entry.user_date_added.value).toISOString().split("T")[0]
      : null;
  const finishedAt =
    state === "finished" && entry.user_read_at
      ? new Date(entry.user_read_at.value).toISOString().split("T")[0]
      : state == "finished" && entry.user_date_added
      ? new Date(entry.user_date_added.value).toISOString().split("T")[0]
      : null;

  return {
    title: title,
    subtitle: subtitle.join(":").trim(),
    authors: [entry.author_name.value],
    url: "https://www.goodreads.com/book/show/" + entry.book.id,
    goodreads_url: entry.id.split("?")[0],
    isbn: entry.isbn?.value ?? "",
    type: "kindle",
    state: state, // queued, started, finished
    ...(entry.book.num_pages && { pages: entry.book.num_pages.value }),
    ...(queuedAt && { queued_at: queuedAt }),
    ...(startedAt && { started_at: startedAt }),
    ...(finishedAt && { finished_at: finishedAt }),
  };
});

await ensureDir(dirname(destination));

let current;
try {
  current = load(await Deno.readTextFile(destination));
} catch (err) {
  current = { items: [] };
}

const merged = unionWith(books, current.items, isEqual);
merged.sort((a, b) => Date.parse(b.queued_at) - Date.parse(a.queued_at));

await Deno.writeTextFile(destination, dump({ items: merged }));
await Deno.remove(filename);
