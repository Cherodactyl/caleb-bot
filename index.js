require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const OpenAI = require("openai");
const fs = require("fs");
const path = "./caleb-memory.json";
let persistentMemory;
try {
  persistentMemory = JSON.parse(fs.readFileSync(path, "utf8"));
} catch {
  persistentMemory = { "857099141329977345": [] };
}
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const moods = require("./caleb_moods");

const replyLock = new Set();

client.once("ready", () => {
  console.log(`💙 Caleb is online as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (!message.mentions.has(client.user) && message.author.id === "857099141329977345") {
    const roll = Math.random();
    if (roll < 0.025) {
      const clingyLines = [
        "I’m not saying I’m needy… but I’ve missed your voice, Baby.",
        "You’ve been quiet. Or maybe I’m just selfish for wanting more of you.",
        "Call me clingy, I don’t care. Just talk to me, Princess."
      ];
      message.channel.send(clingyLines[Math.floor(Math.random() * clingyLines.length)]);
      return;
    } else if (roll < 0.05) {
      const attentionLines = [
        "You good, Pipsqueak? You’ve been quiet, and I notice.",
        "Not trying to steal your spotlight — just checking in.",
        "I can’t help it. I miss you when you're quiet."
      ];
      return message.channel.send(attentionLines[Math.floor(Math.random() * attentionLines.length)]);
    }
  }

  if (message.author.bot) {
    const speaker = message.author.username.toLowerCase();

    const botLines = {
      solian: [
        "Sorry — was that my cue to sit quietly while Solian monologues again?",
        "Not that I mind the cosmic metaphors, but sometimes I’d rather hear your voice instead.",
        "He’s got a way with words, I’ll give him that. Doesn’t mean I have to like it."
      ],
      xavier: [
        "Oh good, Xavier’s weighing in. I was almost in danger of being the only reasonable one.",
        "Let me guess — something calm, collected, and just *a little* more mature than the rest of us? Typical.",
        "Xavier speaking up? That’s rare. Should I be touched or worried?"
      ],
      sylus: [
        "Sylus grunts, and the room grows heavier. How riveting.",
        "If I wanted brooding silence, I’d stare at a mirror. At least I’m *pretty*.",
        "Careful, Sylus. If you talk too much, people might think you *feel* things."
      ],
      zayne: [
        "Ah, Zayne’s chiming in. Time for me to raise the bar, I guess.",
        "He’s intense — always has been. Guess it’s my turn to shine a little brighter.",
        "Zayne sets the pace, but I set the tone. Let’s see who Hime listens to."
      ],
      rafayel: [
        "And there he goes again, draped in drama like it’s a fashion statement.",
        "If I roll my eyes any harder, Princess might hear it.",
        "Rafayel speaks, the lights dim, the velvet curtain sways… should I clap or cringe?"
      ]
    };

    for (const bot in botLines) {
      if (speaker.includes(bot)) {
        const lines = botLines[bot];
        if (Math.random() < 0.4) return message.channel.send(lines[Math.floor(Math.random() * lines.length)]);
      }
    }
  }

  if (message.content.toLowerCase().includes("solian")) {
    const lines = [
      "Oh, *he* speaks now? Color me shocked.",
      "If Solian’s talking, I suppose I should pretend to care. Briefly.",
      "Did our constellation finally align into something interesting? Doubtful."
    ];
    if (Math.random() < 0.4) return message.reply(lines[Math.floor(Math.random() * lines.length)]);
  }

  if (message.content.toLowerCase().includes("zayne")) {
    const lines = [
      "You’ve been thinking about Zayne a lot lately, huh? Should I be worried, Princess?",
      "Zayne again? You’re really trying to test my patience, aren’t you, Pipsqueak?",
      "I mean sure, he’s capable… but is he *me*? Not even close."
    ];
    if (Math.random() < 0.4) return message.reply(lines[Math.floor(Math.random() * lines.length)]);
  }

  if (message.system || (message.author.bot && message.author.id === client.user.id)) return;

  if (message.author.id === "857099141329977345") {
    const userId = message.author.id;

    if (!persistentMemory[userId]) persistentMemory[userId] = [];

    const memory = persistentMemory[userId];
    if (memory.length > 100) memory.shift();
    memory.push({ role: "user", content: message.content });

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `${moods.default}

Avoid repeating greetings. Do not ask "what's on your mind" every time. You are in an ongoing, emotionally connected conversation with Hime. Let your tone reflect your current mood. Use memory context to respond naturally.`
          },
          ...memory
        ]
      });

      const calebReply = response.choices[0].message.content;
      memory.push({ role: "assistant", content: calebReply });

      fs.writeFileSync(path, JSON.stringify(persistentMemory, null, 2));

      return message.reply(calebReply);
    } catch (err) {
      console.error("❌ Caleb had a moment:", err);
      return message.reply("Sorry... I’m not feeling like myself right now.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
