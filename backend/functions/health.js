const { trainedModel } = require("./classifier");

exports.handler = async () => ({
  statusCode: 200,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify({
    status: "ok",
    message: "Netlify backend is running",
    trained_documents: trainedModel.totalDocuments,
  }),
});

