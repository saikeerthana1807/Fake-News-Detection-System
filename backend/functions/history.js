exports.handler = async () => ({
  statusCode: 200,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify({
    predictions: [],
    note: "On Netlify, prediction history is stored in the browser because local SQLite files are not persistent.",
  }),
});

