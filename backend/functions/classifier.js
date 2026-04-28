const tokenPattern = /[a-zA-Z][a-zA-Z']+/g;

const datasetRows = [
  {
    title: "Government announces new rural health scheme",
    content: "The health ministry announced a verified rural care scheme after cabinet approval. Officials released budget details and implementation timelines.",
    label: "real",
  },
  {
    title: "Scientists publish climate research in peer reviewed journal",
    content: "Researchers from multiple universities published a peer reviewed climate study with open data and transparent methodology.",
    label: "real",
  },
  {
    title: "Election commission confirms final voting dates",
    content: "The election commission issued an official notification listing polling dates counting schedules and security arrangements.",
    label: "real",
  },
  {
    title: "Local school wins national innovation award",
    content: "A government press note confirmed that a local school received a national innovation award for its low cost water testing project.",
    label: "real",
  },
  {
    title: "Central bank keeps interest rate unchanged",
    content: "The central bank kept the policy interest rate unchanged after reviewing inflation and growth data during its monetary policy meeting.",
    label: "real",
  },
  {
    title: "Hospital opens new emergency ward",
    content: "City hospital administrators opened a new emergency ward with additional beds trained staff and public funding support.",
    label: "real",
  },
  {
    title: "Court releases written judgement in public case",
    content: "The high court released a written judgement explaining the legal reasoning in a public interest case.",
    label: "real",
  },
  {
    title: "University starts scholarship program",
    content: "The university announced a scholarship program for first generation students with eligibility details published on its official website.",
    label: "real",
  },
  {
    title: "Railway department adds festival special trains",
    content: "The railway department added festival special trains on busy routes and published official ticket booking schedules.",
    label: "real",
  },
  {
    title: "Weather department warns of heavy rainfall",
    content: "The meteorological department issued a heavy rainfall warning based on satellite observations and regional forecast models.",
    label: "real",
  },
  {
    title: "Public transport app launches in metro city",
    content: "The city transport authority launched a public app showing bus routes arrival times and ticket information.",
    label: "real",
  },
  {
    title: "New crop insurance deadline announced",
    content: "The agriculture department announced the crop insurance registration deadline and listed official help centers for farmers.",
    label: "real",
  },
  {
    title: "International agency publishes education report",
    content: "An international agency published an education report using survey data school records and country level comparisons.",
    label: "real",
  },
  {
    title: "Secret miracle drink cures all diseases overnight",
    content: "A viral message claims a secret miracle drink can cure every disease overnight without doctors or medicine.",
    label: "fake",
  },
  {
    title: "Celebrity gives free phones to everyone who shares link",
    content: "A social media post falsely claims that a celebrity is giving free phones to anyone who forwards an unknown link.",
    label: "fake",
  },
  {
    title: "Government bans all bank accounts from tomorrow",
    content: "A viral rumor claims every bank account will be banned tomorrow but provides no official source or notification.",
    label: "fake",
  },
  {
    title: "Scientists discover aliens living under city mall",
    content: "A fabricated article claims scientists found aliens under a shopping mall but cites no research institution or evidence.",
    label: "fake",
  },
  {
    title: "Election result changed by hidden machine code",
    content: "A misleading post claims hidden machine code changed election results while ignoring official audit and counting records.",
    label: "fake",
  },
  {
    title: "Doctor says one leaf replaces all vaccines",
    content: "A false health article claims one leaf can replace all vaccines and asks readers to buy an unverified supplement.",
    label: "fake",
  },
  {
    title: "Breaking news moon will disappear next week",
    content: "A fake astronomy post claims the moon will disappear next week despite no statement from any space agency.",
    label: "fake",
  },
  {
    title: "Prime minister announces money for every forwarded message",
    content: "A viral fake post claims citizens will receive money for every forwarded message if they register on an unknown website.",
    label: "fake",
  },
  {
    title: "Bank warns customers to share passwords for verification",
    content: "A fraudulent message says bank customers must share passwords for verification or their accounts will close.",
    label: "fake",
  },
  {
    title: "Ancient coin found in backyard worth billions guaranteed",
    content: "A clickbait story claims an ordinary backyard coin is guaranteed to be worth billions without expert verification.",
    label: "fake",
  },
  {
    title: "Viral post says drinking petrol improves memory",
    content: "A dangerous fake post claims drinking petrol improves memory and includes no medical evidence or verified source.",
    label: "fake",
  },
  {
    title: "Fake lottery message asks users to pay processing fee",
    content: "A fake lottery message tells users they won a prize and must pay a processing fee through an unknown link.",
    label: "fake",
  },
];

function tokenize(text) {
  return (text.match(tokenPattern) || []).map((token) => token.toLowerCase());
}

function createCounter() {
  return new Map();
}

function increment(counter, key, amount = 1) {
  counter.set(key, (counter.get(key) || 0) + amount);
}

function train() {
  const rows = datasetRows;
  const classDocumentCounts = createCounter();
  const classWordCounts = {
    fake: createCounter(),
    real: createCounter(),
  };
  const classTotalWords = createCounter();
  const vocabulary = new Set();

  rows.forEach((row) => {
    const label = row.label.trim().toLowerCase();
    const tokens = tokenize(`${row.title} ${row.content}`);

    increment(classDocumentCounts, label);
    increment(classTotalWords, label, tokens.length);

    tokens.forEach((token) => {
      increment(classWordCounts[label], token);
      vocabulary.add(token);
    });
  });

  return {
    rows,
    classDocumentCounts,
    classWordCounts,
    classTotalWords,
    vocabulary,
    totalDocuments: rows.length,
  };
}

const trainedModel = train();

function normalize(fakeScore, realScore) {
  const highest = Math.max(fakeScore, realScore);
  const fakeExp = Math.exp(fakeScore - highest);
  const realExp = Math.exp(realScore - highest);
  const total = fakeExp + realExp;
  return [fakeExp / total, realExp / total];
}

function evidenceWords(tokens, predictedLabel) {
  const seen = new Set();
  const uniqueTokens = tokens.filter((token) => {
    if (seen.has(token) || !trainedModel.vocabulary.has(token)) {
      return false;
    }
    seen.add(token);
    return true;
  });

  const otherLabel = predictedLabel === "fake" ? "real" : "fake";
  return uniqueTokens
    .map((token) => {
      const predictedCount = (trainedModel.classWordCounts[predictedLabel].get(token) || 0) + 1;
      const otherCount = (trainedModel.classWordCounts[otherLabel].get(token) || 0) + 1;
      return { token, score: predictedCount / otherCount };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.token);
}

function predict(title, content) {
  const tokens = tokenize(`${title} ${content}`);
  const labels = ["fake", "real"];
  const scores = {};
  const vocabularySize = Math.max(trainedModel.vocabulary.size, 1);

  labels.forEach((label) => {
    const classDocs = trainedModel.classDocumentCounts.get(label) || 0;
    const prior = Math.log((classDocs + 1) / (trainedModel.totalDocuments + labels.length));
    const denominator = (trainedModel.classTotalWords.get(label) || 0) + vocabularySize;

    const tokenScore = tokens.reduce((sum, token) => {
      const count = trainedModel.classWordCounts[label].get(token) || 0;
      return sum + Math.log((count + 1) / denominator);
    }, 0);

    scores[label] = prior + tokenScore;
  });

  const [fakeProbability, realProbability] = normalize(scores.fake, scores.real);
  const label = fakeProbability >= realProbability ? "Fake" : "Real";
  const confidence = Math.max(fakeProbability, realProbability);

  return {
    label,
    confidence: Number(confidence.toFixed(4)),
    fake_probability: Number(fakeProbability.toFixed(4)),
    real_probability: Number(realProbability.toFixed(4)),
    evidence_words: evidenceWords(tokens, label.toLowerCase()),
  };
}

module.exports = {
  predict,
  trainedModel,
};
