import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  X, 
  ChefHat, 
  Clock, 
  BarChart, 
  Flame, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp,
  Utensils,
  AlertCircle,
  Loader2
} from 'lucide-react';

// --- Types ---
interface Recipe {
  emoji: string;
  name: string;
  tagline: string;
  time: string;
  difficulty: string;
  calories: string;
  ingredients: string[];
  steps: string[];
  tip: string;
}

// --- Constants ---
const CUISINES = ["Any", "Indian", "Italian", "Mexican", "Chinese", "Japanese", "French", "Mediterranean", "American"];
const DIETS = ["No restriction", "Vegetarian", "Vegan", "Gluten-free", "Keto", "Paleo", "Low-carb"];
const TIMES = ["Any time", "Under 15 mins", "Under 30 mins", "Under 45 mins", "1 hour+"];
const DIFFICULTIES = ["Any level", "Easy", "Intermediate", "Advanced"];

export default function App() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [cuisine, setCuisine] = useState("Any");
  const [diet, setDiet] = useState("No restriction");
  const [time, setTime] = useState("Any time");
  const [difficulty, setDifficulty] = useState("Any level");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // Initialize Gemini
  const ai = new GoogleGenAI
  ({
     apiKey: process.env.GEMINI_API_KEY 
    });

  const addIngredient = () => {
    const val = inputValue.trim();
    if (!val) return;
    
    const items = val.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const newIngredients = [...ingredients];
    
    items.forEach(item => {
      if (!newIngredients.includes(item)) {
        newIngredients.push(item);
      }
    });
    
    setIngredients(newIngredients);
    setInputValue("");
    setError(null);
  };

  const removeIngredient = (name: string) => {
    setIngredients(ingredients.filter(i => i !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addIngredient();
    }
  };

  const generateRecipes = async () => {
    if (ingredients.length === 0) {
      setError("Please add at least one ingredient first.");
      return;
    }

    setLoading(true);
    setError(null);
    setRecipes([]);
    setExpandedIdx(null);

    try {
      const prompt = `You are a creative and knowledgeable chef AI.
The user has these ingredients: ${ingredients.join(', ')}.
Preferences — Cuisine: ${cuisine}, Diet: ${diet}, Time: ${time}, Difficulty: ${difficulty}.

Generate exactly 3 creative, practical, and delicious recipe suggestions using primarily these ingredients (you may suggest 1-2 common pantry additions if truly needed).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                emoji: { type: Type.STRING, description: "A relevant food emoji" },
                name: { type: Type.STRING, description: "The name of the recipe" },
                tagline: { type: Type.STRING, description: "One-line appetizing description" },
                time: { type: Type.STRING, description: "Estimated cooking time" },
                difficulty: { type: Type.STRING, description: "Difficulty level" },
                calories: { type: Type.STRING, description: "Estimated calories per serving" },
                ingredients: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "List of ingredients with quantities"
                },
                steps: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Step-by-step instructions"
                },
                tip: { type: Type.STRING, description: "A practical chef tip" }
              },
              required: ["emoji", "name", "tagline", "time", "difficulty", "calories", "ingredients", "steps", "tip"]
            }
          }
        }
      });

      const result = JSON.parse(response.text || "[]");
      setRecipes(result);
      if (result.length === 0) {
        setError("No recipes found. Try adding more ingredients or changing preferences.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong while finding recipes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#1a1a1a] font-serif p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-3 bg-[#5A5A40] rounded-full mb-4"
          >
            <ChefHat className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">FridgeChef AI</h1>
          <p className="text-[#5A5A40] italic">Turn your leftovers into culinary masterpieces</p>
        </header>

        {/* Main Card */}
        <div className="bg-white rounded-[32px] shadow-sm border border-[#e5e5e0] p-6 md:p-10 mb-8">
          {/* Ingredients Input */}
          <div className="mb-8">
            <label className="block text-sm font-sans font-semibold uppercase tracking-wider text-[#5A5A40] mb-3">
              Your Ingredients
            </label>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. eggs, spinach, garlic"
                className="flex-1 bg-[#f9f9f7] border border-[#e5e5e0] rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
              />
              <button
                onClick={addIngredient}
                className="bg-[#5A5A40] text-white px-6 py-3 rounded-xl font-sans font-semibold hover:bg-[#4a4a35] transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              <AnimatePresence>
                {ingredients.length === 0 ? (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    className="text-sm italic text-[#5A5A40] py-2"
                  >
                    No ingredients added yet
                  </motion.span>
                ) : (
                  ingredients.map((ing) => (
                    <motion.span
                      key={ing}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="bg-[#f0f0eb] text-[#5A5A40] px-3 py-1.5 rounded-full text-sm font-sans flex items-center gap-2 border border-[#e5e5e0]"
                    >
                      {ing}
                      <button 
                        onClick={() => removeIngredient(ing)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.span>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Preferences Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div>
              <label className="block text-sm font-sans font-semibold uppercase tracking-wider text-[#5A5A40] mb-2">Cuisine</label>
              <select 
                value={cuisine} 
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full bg-[#f9f9f7] border border-[#e5e5e0] rounded-xl px-4 py-3 font-sans focus:outline-none"
              >
                {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-sans font-semibold uppercase tracking-wider text-[#5A5A40] mb-2">Diet</label>
              <select 
                value={diet} 
                onChange={(e) => setDiet(e.target.value)}
                className="w-full bg-[#f9f9f7] border border-[#e5e5e0] rounded-xl px-4 py-3 font-sans focus:outline-none"
              >
                {DIETS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-sans font-semibold uppercase tracking-wider text-[#5A5A40] mb-2">Time</label>
              <select 
                value={time} 
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#f9f9f7] border border-[#e5e5e0] rounded-xl px-4 py-3 font-sans focus:outline-none"
              >
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-sans font-semibold uppercase tracking-wider text-[#5A5A40] mb-2">Difficulty</label>
              <select 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-[#f9f9f7] border border-[#e5e5e0] rounded-xl px-4 py-3 font-sans focus:outline-none"
              >
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateRecipes}
            disabled={loading}
            className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-sans font-bold text-lg hover:bg-[#4a4a35] transition-all flex items-center justify-center gap-3 disabled:opacity-70 shadow-lg shadow-[#5A5A40]/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Finding recipes...
              </>
            ) : (
              <>
                <Utensils className="w-6 h-6" />
                Get Recipe Suggestions
              </>
            )}
          </button>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 font-sans text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Section */}
        <div className="space-y-6 pb-20">
          {recipes.map((recipe, idx) => (
            <motion.div
              key={idx}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[24px] border border-[#e5e5e0] overflow-hidden shadow-sm"
            >
              {/* Card Header */}
              <div 
                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                className="p-6 cursor-pointer flex items-start gap-4 hover:bg-[#f9f9f7] transition-colors"
              >
                <div className="text-4xl shrink-0">{recipe.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{recipe.name}</h3>
                  <p className="text-[#5A5A40] text-sm italic mb-3">{recipe.tagline}</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-sans bg-[#f0f0eb] px-2.5 py-1 rounded-full text-[#5A5A40]">
                      <Clock className="w-3.5 h-3.5" /> {recipe.time}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-sans bg-[#f0f0eb] px-2.5 py-1 rounded-full text-[#5A5A40]">
                      <BarChart className="w-3.5 h-3.5" /> {recipe.difficulty}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-sans bg-[#f0f0eb] px-2.5 py-1 rounded-full text-[#5A5A40]">
                      <Flame className="w-3.5 h-3.5" /> {recipe.calories}
                    </span>
                  </div>
                </div>
                <div className="text-[#5A5A40] mt-1">
                  {expandedIdx === idx ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>

              {/* Card Body */}
              <AnimatePresence>
                {expandedIdx === idx && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-[#f0f0eb]"
                  >
                    <div className="p-6 space-y-8">
                      {/* Ingredients */}
                      <div>
                        <h4 className="text-sm font-sans font-bold uppercase tracking-wider text-[#5A5A40] mb-4 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#5A5A40]" />
                          Ingredients
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                          {recipe.ingredients.map((ing, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm font-sans">
                              <span className="text-[#5A5A40] mt-1">•</span>
                              {ing}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Steps */}
                      <div>
                        <h4 className="text-sm font-sans font-bold uppercase tracking-wider text-[#5A5A40] mb-4 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#5A5A40]" />
                          Instructions
                        </h4>
                        <ol className="space-y-4">
                          {recipe.steps.map((step, i) => (
                            <li key={i} className="flex gap-4 text-sm font-sans leading-relaxed">
                              <span className="shrink-0 w-6 h-6 rounded-full bg-[#f0f0eb] text-[#5A5A40] flex items-center justify-center text-xs font-bold">
                                {i + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Tip */}
                      <div className="bg-[#fdfdfb] border border-[#f0f0eb] p-4 rounded-xl">
                        <div className="flex gap-3">
                          <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
                          <div>
                            <span className="text-xs font-sans font-bold uppercase tracking-wider text-[#5A5A40] block mb-1">Chef's Tip</span>
                            <p className="text-sm italic">{recipe.tip}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
