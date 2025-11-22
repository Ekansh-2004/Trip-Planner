import axios from "axios";
export const analyzeTravelQuery = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });


    const pythonResponse = await axios.post("http://localhost:5001/parse", { text });
    const nlpData = pythonResponse.data;

    const { category } = nlpData;


    const recommendations = {
      hill_station: ["Manali", "Shimla", "Mussoorie", "Darjeeling", "Nainital"],
      beach: ["Goa", "Gokarna", "Andaman Islands", "Varkala", "Pondicherry"],
      religious: ["Varanasi", "Rishikesh", "Haridwar", "Tirupati", "Bodh Gaya"],
      adventure: ["Rishikesh", "Manali", "Leh-Ladakh", "Spiti Valley", "Kasol"],
      nature: ["Munnar", "Coorg", "Wayanad", "Jim Corbett", "Kaziranga"],
      historical: ["Jaipur", "Agra", "Delhi", "Hampi", "Khajuraho"]
    };


    if (category && recommendations[category]) {
      return res.json({
        user_input: text,
        detected_category: category,
        message: `Here are some popular ${category.replace("_", " ")} destinations in India:`,
        suggestions: recommendations[category]
      });
    } else {
      return res.json({
        user_input: text,
        detected_category: category,
        message: "Sorry, I couldn’t understand your request clearly.",
        suggestions: []
      });
    }

  } catch (error) {
    console.error("Error in NLP route:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
