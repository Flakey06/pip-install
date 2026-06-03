const TOPICS_BY_INTEREST = {
  ai: [
    "What do you think AI will look like in 10 years?",
    "Would you trust an AI to make important decisions for you?",
    "What's the most impressive AI tool you've used recently?",
    "Do you think AI will replace your future job?",
  ],
  hackathons: [
    "What's the best project you've ever built at a hackathon?",
    "What's your go-to tech stack for hackathons?",
    "Would you rather win a hackathon solo or as a team?",
    "What problem would you solve if you had 24 hours?",
  ],
  gaming: [
    "What game have you sunk the most hours into?",
    "PC, console, or mobile — which do you prefer?",
    "What's a game you'd recommend to anyone?",
    "Do you prefer single player or multiplayer?",
  ],
  music: [
    "What song have you had on repeat lately?",
    "Which artist would you love to see live?",
    "Do you play any instruments?",
    "What genre do you listen to when studying?",
  ],
  sports: [
    "What sport do you play or follow most?",
    "Who's your favourite athlete of all time?",
    "Would you rather be incredibly fast or incredibly strong?",
    "What sport would you pick up if you had time?",
  ],
  basketball: [
    "Who's the GOAT — LeBron or Jordan?",
    "Do you prefer watching or playing basketball?",
    "What's your favourite NBA team?",
    "Could you beat anyone in this group in a 1v1?",
  ],
  cooking: [
    "What's your signature dish?",
    "Do you prefer cooking or ordering in?",
    "What cuisine could you eat every day?",
    "What's the hardest thing you've ever tried to cook?",
  ],
  travelling: [
    "What's the best place you've ever travelled to?",
    "Where's your dream destination?",
    "Do you prefer solo travel or group travel?",
    "What's the most unexpected thing that happened while travelling?",
  ],
  fitness: [
    "What's your current workout routine?",
    "Gym, outdoor, or home workout — which do you prefer?",
    "What's your fitness goal right now?",
    "What's the hardest workout you've ever done?",
  ],
  art: [
    "What's your favourite art style or medium?",
    "Do you create art yourself?",
    "What's a piece of art that left an impression on you?",
    "Would you rather visit the Louvre or MoMA?",
  ],
  design: [
    "What's a product you think is brilliantly designed?",
    "Do you prefer minimalist or maximalist design?",
    "What design tool do you use most?",
    "What's something you'd redesign if you could?",
  ],
  movies: [
    "What's the last movie that genuinely surprised you?",
    "Which movie could you watch over and over?",
    "Do you prefer watching at home or at the cinema?",
    "What's a movie everyone loves but you didn't enjoy?",
  ],
  anime: [
    "What's your all-time favourite anime?",
    "Sub or dub — which do you prefer?",
    "What anime would you recommend to a first-timer?",
    "Which anime character do you relate to most?",
  ],
  reading: [
    "What's the last book you couldn't put down?",
    "Do you prefer fiction or non-fiction?",
    "What book would you recommend to everyone?",
    "Physical books or e-books?",
  ],
  coding: [
    "What's your favourite programming language and why?",
    "What's the most satisfying bug you've ever fixed?",
    "What project are you currently working on?",
    "What's something you wish you knew when you started coding?",
  ],
  default: [
    "What's something interesting that happened this week?",
    "What's a skill you're currently learning?",
    "What's your go-to way to de-stress?",
    "If you could have dinner with anyone, who would it be?",
    "What's something you're looking forward to?",
  ]
};

export function generateTopic(sharedInterests = []) {
  for (const interest of sharedInterests) {
    const topics = TOPICS_BY_INTEREST[interest.toLowerCase()];
    if (topics) {
      return topics[Math.floor(Math.random() * topics.length)];
    }
  }
  const defaults = TOPICS_BY_INTEREST.default;
  return defaults[Math.floor(Math.random() * defaults.length)];
}