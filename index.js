require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3500;
const path = require("path");
const { Configuration, OpenAIApi } = require("openai");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

let visitors = 0;

const askAI = async (question, context) => {
  try {
    let model = "gpt-3.5-turbo";
    const aiKey = process.env.OPENAI_API_KEY;
    const messages = [
      {
        role: "system",
        content: `You will assist user with the following question: ${question} additional context:${context}`,
      },
      {
        role: "user",
        content: `additional context:${context}`,
      },
    ];
    const configuration = new Configuration({
      organization: "org-Sa4Q7acTkRgOXB8R7GJVB7Hr",
      apiKey: aiKey,
    });
    const openai = new OpenAIApi(configuration);
    const completion = await openai.createChatCompletion({
      model: model,
      messages: messages,
    });
    let answer = completion.data.choices[0].message.content;

    // conversations.push({
    // 	// uuid: uuid,
    // 	messages: [...messages],
    // });
    console.log(answer);
    return answer;
  } catch (err) {
    console.log(err);
    return "Sorry, I don't understand.";
  }
};

let dailywisdom = "";
let today = new Date();
console.log(today.getDate());

app.get("/dailywisdom", async (req, res) => {
  visitors++;
  try {
    let question = req.query.question;
    let context = req.query.context;
    if (question === undefined || context === undefined) {
      if (today.getDate() !== new Date().getDate() || dailywisdom === "") {
        question =
          "Provide daily wisdom quote. You are a sage, create a new philosophy. It will be based on the tenets of the Trivium and the concept 'Man know thyself' Put into a single unified theory. Do not mention the name trivium, use only concepts to teach, oh wise one.";

        context = `Yesterday's wisdom: ${
          dailywisdom.length > 0
            ? dailywisdom
            : "This is the first day of wisdom."
        }`;

        const answer = await askAI(question, context);

        dailywisdom = answer;
        today = new Date();

        return res.json({
          //English date format in words
          today: `${today.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`,
          wisdom: answer,
          visitors: visitors,
        });
      } else {
        return res.json({
          today: `${today.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`,
          wisdom: dailywisdom,
          visitors: visitors,
        });
      }
    }
    const answer = await askAI(question, context);
    return res.json({
      today: `${today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      wisdom: answer,
      visitors: visitors,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});
let userWisdom = "";

app.get("/newwisdom", async (req, res) => {
  try {
    const question =
      "Provide more wisdom. You are a sage, create a new philosophy. It will be based on the tenets of the Trivium and the concept 'Man know thyself' Put into a single unified theory. Do not mention the name trivium, use only concepts to teach, oh wise one.";
    let context = `Yesterday's wisdom: ${
      userWisdom.length > 0 ? userWisdom : dailywisdom
    }`;
    const answer = await askAI(question, context);
    userWisdom = answer;

    return res.json({
      today: `${today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      wisdom: answer,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.post("/api/askAI", async (req, res) => {
  try {
    const question = req.body.question;
    let context = req.body.context;
    const conversation = req.body.conversation;
    if (conversation.length > 0) {
      context = context + " " + "previous conversation: " + conversation;
    }
    console.log(context, question);
    const answer = await askAI(question, context);
    res.json({ answer: answer });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
