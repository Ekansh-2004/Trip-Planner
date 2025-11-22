import Activity from "../models/Activities.js";
import Cuisine from "../models/Cuisine.js";

export const getCuisinesByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const cuisines = await Cuisine.find({ city: city });
    res.status(200).json(cuisines);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getActivitiesByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const activities = await Activity.find({ city: city });
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

