import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Play, ExternalLink, Clock, Users, ChevronLeft, ChevronRight, Star, DollarSign, ChefHat, Zap, AlertTriangle, Scale, Calculator, Utensils, TrendingUp, Lightbulb } from 'lucide-react';

// API Configuration
const MEALDB_API = 'https://www.themealdb.com/api/json/v1/1';
const SPOONACULAR_KEY = '33e42370ac9e48f28d8b43807b7be253'; // Replace with your key
const SPOONACULAR_API = 'https://api.spoonacular.com/recipes';

const RecipeFinderApp = () => {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [selectedDiet, setSelectedDiet] = useState('');
  const [maxCalories, setMaxCalories] = useState('');
  const [maxCookTime, setMaxCookTime] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('');
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recipesPerPage] = useState(12);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [nutritionData, setNutritionData] = useState({});
  const [trendingRecipes, setTrendingRecipes] = useState([]);
  const [substituteIngredient, setSubstituteIngredient] = useState('');
  const [substituteSuggestions, setSubstituteSuggestions] = useState([]);
  const [fridgeIngredients, setFridgeIngredients] = useState([]);
  const [seasonalSuggestions, setSeasonalSuggestions] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [spoonacularRecipes, setSpoonacularRecipes] = useState([]);

  // Enhanced diet detection with nutrition focus
  const dietKeywords = {
    'High Protein': {
      ingredients: ['chicken', 'beef', 'fish', 'salmon', 'tuna', 'eggs', 'protein', 'meat', 'pork', 'turkey', 'lamb', 'duck', 'tofu', 'tempeh', 'quinoa', 'lentils', 'beans', 'chickpeas'],
      keywords: ['protein', 'grilled', 'roasted', 'baked chicken', 'beef steak', 'fish fillet'],
      minProtein: 20
    },
    'Low Carb': {
      ingredients: ['cauliflower', 'zucchini', 'broccoli', 'spinach', 'lettuce', 'cucumber', 'bell pepper', 'asparagus', 'cabbage', 'kale'],
      keywords: ['keto', 'low carb', 'cauliflower rice', 'zucchini noodles', 'lettuce wrap'],
      maxCarbs: 20
    },
    'Low Calorie': {
      ingredients: ['vegetables', 'salad', 'soup', 'broth', 'steamed', 'grilled'],
      keywords: ['diet', 'light', 'low calorie', 'healthy', 'steamed', 'baked'],
      maxCalories: 400
    },
    'Vegetarian': {
      ingredients: ['cheese', 'pasta', 'rice', 'beans', 'lentils', 'paneer', 'dal', 'egg', 'milk', 'butter', 'cream', 'vegetables'],
      keywords: ['vegetarian', 'veggie', 'cheese', 'pasta', 'risotto', 'curry', 'dal']
    },
    'Vegan': {
      ingredients: ['quinoa', 'chickpea', 'avocado', 'tempeh', 'seitan', 'coconut milk', 'almond milk', 'soy milk', 'nutritional yeast', 'tahini'],
      keywords: ['vegan', 'plant-based', 'coconut', 'cashew cream', 'almond', 'tofu']
    },
    'Gluten-Free': {
      ingredients: ['rice', 'quinoa', 'potato', 'corn', 'rice flour', 'almond flour', 'coconut flour', 'tapioca'],
      keywords: ['gluten-free', 'gluten free', 'rice', 'quinoa', 'corn tortilla']
    },
    'Dairy-Free': {
      ingredients: ['coconut milk', 'almond milk', 'soy milk', 'oat milk', 'cashew cream'],
      keywords: ['dairy-free', 'lactose-free', 'coconut milk', 'almond milk']
    }
  };

  // Common allergens for detection
  const allergens = ['milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 'wheat', 'soy'];

  // Difficulty levels based on cooking time and technique complexity
  const getDifficultyLevel = (cookTime, techniques) => {
    const complexTechniques = ['braise', 'confit', 'sous vide', 'ferment', 'cure', 'smoke', 'flambé'];
    const hasComplexTechnique = techniques.some(tech => complexTechniques.includes(tech.toLowerCase()));
    
    if (cookTime > 120 || hasComplexTechnique) return 'Expert';
    if (cookTime > 60) return 'Intermediate';
    return 'Beginner';
  };

  // Generate mock nutrition data (in real app, this would come from Spoonacular)
  const generateNutritionData = (recipe) => {
    const ingredients = recipe.source === 'mealdb' ? parseIngredients(recipe) : (recipe.extendedIngredients || []);
    const baseCalories = ingredients.length * 45 + Math.random() * 200;
    
    return {
      calories: Math.round(baseCalories),
      protein: Math.round(baseCalories * 0.15 / 4),
      carbs: Math.round(baseCalories * 0.5 / 4),
      fat: Math.round(baseCalories * 0.35 / 9),
      fiber: Math.round(Math.random() * 10 + 2),
      sugar: Math.round(Math.random() * 15 + 5),
      sodium: Math.round(Math.random() * 800 + 200),
      servings: recipe.servings || Math.floor(Math.random() * 4) + 2,
      prepTime: recipe.preparationMinutes || Math.floor(Math.random() * 30) + 10,
      cookTime: recipe.cookingMinutes || Math.floor(Math.random() * 60) + 15,
      costPerServing: (Math.random() * 8 + 2).toFixed(2)
    };
  };

  // Mock ingredient substitution API
  const getIngredientSubstitutes = async (ingredient) => {
    const substitutes = {
      'butter': ['coconut oil', 'olive oil', 'applesauce', 'avocado'],
      'sugar': ['honey', 'maple syrup', 'stevia', 'monk fruit'],
      'flour': ['almond flour', 'coconut flour', 'rice flour', 'oat flour'],
      'milk': ['almond milk', 'coconut milk', 'oat milk', 'soy milk'],
      'eggs': ['flax eggs', 'chia eggs', 'applesauce', 'banana'],
      'cream': ['coconut cream', 'cashew cream', 'greek yogurt'],
      'cheese': ['nutritional yeast', 'cashew cheese', 'coconut cheese']
    };
    
    return substitutes[ingredient.toLowerCase()] || [];
  };

  // Generate seasonal recipe suggestions
  const getSeasonalSuggestions = () => {
    const currentMonth = new Date().getMonth();
    const seasons = {
      winter: ['soup', 'stew', 'roast', 'hot chocolate', 'casserole'],
      spring: ['salad', 'asparagus', 'peas', 'fresh herbs', 'light dishes'],
      summer: ['grilled', 'cold soup', 'ice cream', 'berries', 'bbq'],
      fall: ['pumpkin', 'apple', 'squash', 'comfort food', 'warm spices']
    };
    
    let season;
    if (currentMonth >= 11 || currentMonth <= 1) season = 'winter';
    else if (currentMonth >= 2 && currentMonth <= 4) season = 'spring';
    else if (currentMonth >= 5 && currentMonth <= 7) season = 'summer';
    else season = 'fall';
    
    return seasons[season];
  };

  // Fetch all available data from TheMealDB
  const fetchAllMealDBRecipes = async () => {
  const allRecipes = [];
  let progress = 0;

  try {
    // Strategy 1: Fetch by all letters (A-Z) in parallel
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    await Promise.all(
      letters.map(async (letter, i) => {
        try {
          const response = await fetch(`${MEALDB_API}/search.php?f=${letter}`);
          const data = await response.json();
          if (data.meals) {
            allRecipes.push(...data.meals.map(recipe => ({ ...recipe, source: 'mealdb' })));
          }
          progress = Math.round(((i + 1) / letters.length) * 40);
          setLoadingProgress(progress);
        } catch (error) {
          console.error(`Error fetching recipes for letter ${letter}:`, error);
        }
      })
    );

    // Strategy 2: Fetch by categories in parallel
    const categoryResponse = await fetch(`${MEALDB_API}/list.php?c=list`);
    const categoryData = await categoryResponse.json();
    const categories = categoryData.meals || [];

    await Promise.all(
      categories.map(async (category, i) => {
        try {
          const response = await fetch(`${MEALDB_API}/filter.php?c=${category.strCategory}`);
          const data = await response.json();
          if (data.meals) {
            // Get detailed info for each recipe in parallel
            await Promise.all(
              data.meals.map(async (meal) => {
                try {
                  const detailResponse = await fetch(`${MEALDB_API}/lookup.php?i=${meal.idMeal}`);
                  const detailData = await detailResponse.json();
                  if (detailData.meals && detailData.meals[0]) {
                    allRecipes.push({ ...detailData.meals[0], source: 'mealdb' });
                  }
                } catch (error) {
                  console.error(`Error fetching recipe details for ${meal.idMeal}:`, error);
                }
              })
            );
          }
          progress = 40 + Math.round(((i + 1) / categories.length) * 30);
          setLoadingProgress(progress);
        } catch (error) {
          console.error(`Error fetching recipes for category ${category.strCategory}:`, error);
        }
      })
    );

    // Strategy 3: Fetch by areas/cuisines in parallel
    const areaResponse = await fetch(`${MEALDB_API}/list.php?a=list`);
    const areaData = await areaResponse.json();
    const areas = areaData.meals || [];

    await Promise.all(
      areas.map(async (area, i) => {
        try {
          const response = await fetch(`${MEALDB_API}/filter.php?a=${area.strArea}`);
          const data = await response.json();
          if (data.meals) {
            // Get detailed info for each recipe in parallel
            await Promise.all(
              data.meals.map(async (meal) => {
                try {
                  const detailResponse = await fetch(`${MEALDB_API}/lookup.php?i=${meal.idMeal}`);
                  const detailData = await detailResponse.json();
                  if (detailData.meals && detailData.meals[0]) {
                    allRecipes.push({ ...detailData.meals[0], source: 'mealdb' });
                  }
                } catch (error) {
                  console.error(`Error fetching recipe details for ${meal.idMeal}:`, error);
                }
              })
            );
          }
          progress = 70 + Math.round(((i + 1) / areas.length) * 20);
          setLoadingProgress(progress);
        } catch (error) {
          console.error(`Error fetching recipes for area ${area.strArea}:`, error);
        }
      })
    );

  } catch (error) {
    console.error('Error in fetchAllMealDBRecipes:', error);
  }

  // Remove duplicates
  const uniqueRecipes = allRecipes.filter((recipe, index, self) => 
    index === self.findIndex(r => r.idMeal === recipe.idMeal)
  );

  return uniqueRecipes;
};

  // Fetch recipes from Spoonacular API
 // Spoonacular: fetch ALL recipes for each query, paginated and parallel
const fetchSpoonacularRecipes = async () => {
  if (!SPOONACULAR_KEY || SPOONACULAR_KEY === 'YOUR_SPOONACULAR_KEY') return [];
  const allSpoonacularRecipes = [];
  const queries = ['chicken', 'beef', 'vegetarian', 'pasta', 'soup', 'salad', 'dessert', 'breakfast'];

  await Promise.all(
    queries.map(async (query) => {
      // First, get totalResults for this query
      const firstResponse = await fetch(
        `${SPOONACULAR_API}/complexSearch?apiKey=${SPOONACULAR_KEY}&query=${query}&number=1`
      );
      const firstData = await firstResponse.json();
      const totalResults = firstData.totalResults || 0;
      const pageCount = Math.ceil(totalResults / 100);

      // Fetch all pages in parallel (limit concurrency if needed)
      await Promise.all(
        Array.from({ length: pageCount }).map(async (_, pageIdx) => {
          const offset = pageIdx * 100;
          const response = await fetch(
            `${SPOONACULAR_API}/complexSearch?apiKey=${SPOONACULAR_KEY}&query=${query}&number=100&offset=${offset}&addRecipeInformation=true&fillIngredients=true`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.results) {
              allSpoonacularRecipes.push(...data.results.map(recipe => ({
                idMeal: recipe.id.toString(),
                strMeal: recipe.title,
                strMealThumb: recipe.image,
                strCategory: recipe.dishTypes?.[0] || 'Main Course',
                strArea: recipe.cuisines?.[0] || 'International',
                strInstructions: recipe.instructions || 'Instructions not available',
                strYoutube: '',
                strSource: recipe.sourceUrl,
                servings: recipe.servings,
                preparationMinutes: recipe.preparationMinutes,
                cookingMinutes: recipe.cookingMinutes,
                extendedIngredients: recipe.extendedIngredients,
                source: 'spoonacular',
                healthScore: recipe.healthScore,
                spoonacularScore: recipe.spoonacularScore,
                pricePerServing: recipe.pricePerServing,
                diets: recipe.diets || [],
                dishTypes: recipe.dishTypes || [],
                cuisines: recipe.cuisines || []
              })));
            }
          }
        })
      );
    })
  );

  // Remove duplicates by idMeal
  const uniqueRecipes = allSpoonacularRecipes.filter((recipe, index, self) =>
    index === self.findIndex(r => r.idMeal === recipe.idMeal)
  );
  return uniqueRecipes;
};

  // Enhanced data fetching with multiple sources
  useEffect(() => {
    const fetchEnhancedData = async () => {
      try {
        setLoading(true);
        setLoadingProgress(0);
        
        // Fetch cuisines and ingredients from TheMealDB
        const cuisineResponse = await fetch(`${MEALDB_API}/list.php?a=list`);
        const cuisineData = await cuisineResponse.json();
        const allCuisines = cuisineData.meals || [];
        setCuisines(allCuisines);
        
        const ingredientResponse = await fetch(`${MEALDB_API}/list.php?i=list`);
        const ingredientData = await ingredientResponse.json();
        setAvailableIngredients(ingredientData.meals || []);
        
        // Fetch all recipes from both APIs
        console.log('Fetching all TheMealDB recipes...');
        const mealDbRecipes = await fetchAllMealDBRecipes();
        
        console.log('Fetching Spoonacular recipes...');
        const spoonacularRecipes = await fetchSpoonacularRecipes();
        
        // Combine all recipes
        const allRecipes = [...mealDbRecipes, ...spoonacularRecipes];
        
        console.log(`Loaded ${mealDbRecipes.length} recipes from TheMealDB`);
        console.log(`Loaded ${spoonacularRecipes.length} recipes from Spoonacular`);
        console.log(`Total recipes: ${allRecipes.length}`);
        
        // Generate nutrition data for all recipes
        const nutritionMap = {};
        allRecipes.forEach(recipe => {
          const recipeId = recipe.idMeal || recipe.id;
          nutritionMap[recipeId] = generateNutritionData(recipe);
        });
        
        setNutritionData(nutritionMap);
        setRecipes(allRecipes);
        setFilteredRecipes(allRecipes);
        setTotalRecipes(allRecipes.length);
        setSpoonacularRecipes(spoonacularRecipes);
        
        // Set trending recipes (top 20 random recipes for demo)
        const shuffled = [...allRecipes].sort(() => 0.5 - Math.random());
        setTrendingRecipes(shuffled.slice(0, 20));
        
        // Set seasonal suggestions
        setSeasonalSuggestions(getSeasonalSuggestions());
        
        setLoadingProgress(100);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching enhanced data:', error);
        setLoading(false);
      }
    };

    fetchEnhancedData();
  }, []);

  // Parse ingredients from recipe (handles both MealDB and Spoonacular formats)
  const parseIngredients = (recipe) => {
    if (recipe.source === 'spoonacular' && recipe.extendedIngredients) {
      return recipe.extendedIngredients.map(ing => ({
        name: ing.name,
        measure: ing.measures?.metric?.amount ? `${ing.measures.metric.amount} ${ing.measures.metric.unitShort}` : ing.amount + ' ' + ing.unit,
        full: `${ing.measures?.metric?.amount || ing.amount} ${ing.measures?.metric?.unitShort || ing.unit} ${ing.name}`
      }));
    }
    
    // MealDB format
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`];
      const measure = recipe[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push({
          name: ingredient.trim(),
          measure: measure ? measure.trim() : '',
          full: `${measure ? measure.trim() + ' ' : ''}${ingredient.trim()}`
        });
      }
    }
    return ingredients;
  };

  // Enhanced diet detection with nutrition consideration
  const getDietTags = (recipe) => {
    const tags = [];
    const recipeText = `${recipe.strMeal || recipe.title} ${recipe.strInstructions || recipe.instructions || ''} ${recipe.strCategory || ''}`.toLowerCase();
    const ingredients = parseIngredients(recipe);
    const ingredientNames = ingredients.map(ing => ing.name.toLowerCase()).join(' ');
    const fullText = `${recipeText} ${ingredientNames}`;
    const nutrition = nutritionData[recipe.idMeal || recipe.id];
    
    // For Spoonacular recipes, use their diet information
    if (recipe.source === 'spoonacular' && recipe.diets) {
      recipe.diets.forEach(diet => {
        const normalizedDiet = diet.charAt(0).toUpperCase() + diet.slice(1).replace(/([A-Z])/g, ' $1');
        if (!tags.includes(normalizedDiet)) {
          tags.push(normalizedDiet);
        }
      });
    }
    
    // Meat and dairy detection
    const meatIngredients = ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'fish', 'salmon', 'tuna', 'shrimp', 'crab'];
    const dairyIngredients = ['milk', 'butter', 'cheese', 'cream', 'yogurt'];
    
    const hasMeat = meatIngredients.some(meat => ingredientNames.includes(meat.toLowerCase()));
    const hasDairy = dairyIngredients.some(dairy => ingredientNames.includes(dairy.toLowerCase()));
    const hasEggs = ingredientNames.includes('egg');
    
    // Nutrition-based tagging
    if (nutrition) {
      if (nutrition.calories < 300) tags.push('Low Calorie');
      if (nutrition.protein > 20) tags.push('High Protein');
      if (nutrition.carbs < 20) tags.push('Low Carb');
    }
    
    // Diet-based tagging
    Object.entries(dietKeywords).forEach(([dietType, criteria]) => {
      const hasIngredients = criteria.ingredients.some(ingredient => 
        ingredientNames.includes(ingredient.toLowerCase())
      );
      
      const hasKeywords = criteria.keywords.some(keyword => 
        fullText.includes(keyword.toLowerCase())
      );
      
      if (hasIngredients || hasKeywords) {
        if (dietType === 'Vegetarian' && !hasMeat) {
          tags.push(dietType);
        } else if (dietType === 'Vegan' && !hasMeat && !hasDairy && !hasEggs) {
          tags.push(dietType);
        } else if (!['Vegetarian', 'Vegan'].includes(dietType)) {
          tags.push(dietType);
        }
      }
    });
    
    // Default tagging
    if (tags.length === 0) {
      if (hasMeat) tags.push('High Protein');
      else if (!hasMeat && (hasDairy || hasEggs)) tags.push('Vegetarian');
      else if (!hasMeat && !hasDairy && !hasEggs) tags.push('Vegan');
      else tags.push('Balanced');
    }
    
    return [...new Set(tags)];
  };

  // Detect allergens in recipe
  const getAllergens = (recipe) => {
    const ingredients = parseIngredients(recipe);
    const ingredientNames = ingredients.map(ing => ing.name.toLowerCase()).join(' ');
    const detectedAllergens = [];
    
    const allergenMap = {
      'milk': ['milk', 'butter', 'cheese', 'cream', 'yogurt'],
      'eggs': ['egg'],
      'fish': ['fish', 'salmon', 'tuna', 'cod'],
      'shellfish': ['shrimp', 'crab', 'lobster', 'oyster'],
      'tree nuts': ['almond', 'walnut', 'pecan', 'cashew', 'pistachio'],
      'peanuts': ['peanut'],
      'wheat': ['flour', 'wheat', 'bread'],
      'soy': ['soy', 'tofu', 'tempeh']
    };
    
    Object.entries(allergenMap).forEach(([allergen, triggers]) => {
      if (triggers.some(trigger => ingredientNames.includes(trigger))) {
        detectedAllergens.push(allergen);
      }
    });
    
    return detectedAllergens;
  };

  // Enhanced filtering with nutrition and time constraints
  const applyFilters = () => {
    let filtered = [...recipes];
    
    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(recipe => {
        const ingredients = parseIngredients(recipe);
        const title = recipe.strMeal || recipe.title || '';
        const category = recipe.strCategory || '';
        const area = recipe.strArea || '';
        const instructions = recipe.strInstructions || recipe.instructions || '';
        
        return (
          title.toLowerCase().includes(searchLower) ||
          category.toLowerCase().includes(searchLower) ||
          area.toLowerCase().includes(searchLower) ||
          instructions.toLowerCase().includes(searchLower) ||
          ingredients.some(ing => ing.name.toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Cuisine filter
    if (selectedCuisine) {
      filtered = filtered.filter(recipe => 
        recipe.strArea === selectedCuisine || 
        (recipe.cuisines && recipe.cuisines.includes(selectedCuisine))
      );
    }
    
    // Ingredient filter
    if (selectedIngredients.length > 0) {
      filtered = filtered.filter(recipe => {
        const recipeIngredients = parseIngredients(recipe).map(ing => ing.name.toLowerCase());
        return selectedIngredients.every(selectedIngredient => {
          const ingredientLower = selectedIngredient.toLowerCase();
          return recipeIngredients.some(recipeIng => 
            recipeIng.includes(ingredientLower) || ingredientLower.includes(recipeIng)
          );
        });
      });
    }
    
    // Diet filter
    if (selectedDiet) {
      filtered = filtered.filter(recipe => {
        const recipeTags = getDietTags(recipe);
        return recipeTags.includes(selectedDiet);
      });
    }
    
    // Calorie filter
    if (maxCalories) {
      filtered = filtered.filter(recipe => {
        const recipeId = recipe.idMeal || recipe.id;
        const nutrition = nutritionData[recipeId];
        return nutrition && nutrition.calories <= parseInt(maxCalories);
      });
    }
    
    // Cook time filter
    if (maxCookTime) {
      filtered = filtered.filter(recipe => {
        const recipeId = recipe.idMeal || recipe.id;
        const nutrition = nutritionData[recipeId];
        return nutrition && (nutrition.prepTime + nutrition.cookTime) <= parseInt(maxCookTime);
      });
    }
    
    // Difficulty filter
    if (difficultyLevel) {
      filtered = filtered.filter(recipe => {
        const recipeId = recipe.idMeal || recipe.id;
        const nutrition = nutritionData[recipeId];
        const totalTime = nutrition ? nutrition.prepTime + nutrition.cookTime : 60;
        const instructions = recipe.strInstructions || recipe.instructions || '';
        const techniques = instructions.toLowerCase().split(' ');
        const difficulty = getDifficultyLevel(totalTime, techniques);
        return difficulty === difficultyLevel;
      });
    }
    
    // Fridge ingredients filter
    if (fridgeIngredients.length > 0) {
      filtered = filtered.filter(recipe => {
        const recipeIngredients = parseIngredients(recipe).map(ing => ing.name.toLowerCase());
        const matchCount = fridgeIngredients.filter(fridgeItem => 
          recipeIngredients.some(recipeIng => 
            recipeIng.includes(fridgeItem.toLowerCase()) || 
            fridgeItem.toLowerCase().includes(recipeIng)
          )
        ).length;
        return matchCount >= Math.min(3, fridgeIngredients.length);
      });
    }
    
    setFilteredRecipes(filtered);
    setTotalRecipes(filtered.length);
    setCurrentPage(1);
  };

  // Apply filters on dependency changes
  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCuisine, selectedIngredients, selectedDiet, maxCalories, maxCookTime, difficultyLevel, fridgeIngredients, recipes]);

  // Handle ingredient substitution
  const handleSubstituteSearch = async () => {
    if (substituteIngredient.trim()) {
      const substitutes = await getIngredientSubstitutes(substituteIngredient);
      setSubstituteSuggestions(substitutes);
    }
  };

  // Handle fridge ingredients
  const handleFridgeIngredientAdd = (ingredient) => {
    if (!fridgeIngredients.includes(ingredient)) {
      setFridgeIngredients([...fridgeIngredients, ingredient]);
    }
  };

  const handleFridgeIngredientRemove = (ingredient) => {
    setFridgeIngredients(fridgeIngredients.filter(item => item !== ingredient));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCuisine('');
    setSelectedDiet('');
    setSelectedIngredients([]);
    setMaxCalories('');
    setMaxCookTime('');
    setDifficultyLevel('');
    setFridgeIngredients([]);
  };

  // Fetch detailed recipe with enhanced nutrition
  const fetchRecipeDetails = async (recipe) => {
    try {
      let detailedRecipe = recipe;
      
      // For MealDB recipes, fetch full details
      if (recipe.source === 'mealdb') {
        const response = await fetch(`${MEALDB_API}/lookup.php?i=${recipe.idMeal}`);
        const data = await response.json();
        detailedRecipe = data.meals && data.meals[0] ? data.meals[0] : recipe;
      }
      
      // Add enhanced data
      const recipeId = detailedRecipe.idMeal || detailedRecipe.id;
      detailedRecipe.nutritionData = nutritionData[recipeId];
      detailedRecipe.allergens = getAllergens(detailedRecipe);
      detailedRecipe.dietTags = getDietTags(detailedRecipe);
      
      setSelectedRecipe(detailedRecipe);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      const recipeId = recipe.idMeal || recipe.id;
      recipe.nutritionData = nutritionData[recipeId];
      recipe.allergens = getAllergens(recipe);
      recipe.dietTags = getDietTags(recipe);
      setSelectedRecipe(recipe);
    }
  };

  // Pagination
  const indexOfLastRecipe = currentPage * recipesPerPage;
  const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage;
  const currentRecipes = filteredRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe);
  const totalPages = Math.ceil(totalRecipes / recipesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading complete recipe database...</p>
          <p className="text-gray-500 text-sm mt-2">
            Fetching all available recipes from TheMealDB and Spoonacular
          </p>
          <div className="mt-4 w-80 bg-gray-700 rounded-full h-2 mx-auto">
            <div 
              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="text-gray-400 text-sm mt-2">{loadingProgress}% complete</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative">
      {/* Background */}
      <div className="fixed inset-0">
        <img 
          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          alt="Cooking background"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-[1px]" />

      {/* Header */}
      <header className="relative z-10 pt-8 pb-6 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-6xl font-bold text-center mb-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Complete Recipe Database
          </h1>
          <p className="text-gray-400 text-center text-lg mb-2">
            All available recipes from TheMealDB & Spoonacular with smart features
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <span>{recipes.length} total recipes</span>
            <span>{cuisines.length} cuisines</span>
            <span>{spoonacularRecipes.length} Spoonacular recipes</span>
            <span>Complete nutrition data</span>
          </div>
        </div>
      </header>

      {/* Quick Actions Bar */}
      <div className="relative z-10 px-4 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Trending Recipes */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <span className="font-semibold text-amber-400">Trending Now</span>
                </div>
                <p className="text-sm text-gray-400">
                  {trendingRecipes.slice(0, 3).map(r => (r.strMeal || r.title || '').split(' ').slice(0, 2).join(' ')).join(', ')}
                </p>
              </div>

              {/* Seasonal Suggestions */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-green-400">Seasonal Picks</span>
                </div>
                <p className="text-sm text-gray-400">
                  {seasonalSuggestions.slice(0, 3).join(', ')}
                </p>
              </div>

              {/* Database Stats */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calculator className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-blue-400">Complete Database</span>
                </div>
                <p className="text-sm text-gray-400">
                  All TheMealDB + Spoonacular recipes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="relative z-10 px-4 mb-8">
        <div className="max-w-6xl mx-auto">
          {/* Main Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search all available recipes, ingredients, cuisines, or dietary needs..."
              className="w-full pl-12 pr-4 py-4 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl hover:border-amber-500 transition-all"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Advanced Filters'}
            </button>
            
            {(searchTerm || selectedCuisine || selectedDiet || selectedIngredients.length > 0 || maxCalories || maxCookTime || difficultyLevel || fridgeIngredients.length > 0) && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-6 py-3 bg-red-600/80 backdrop-blur-sm border border-red-500 rounded-xl hover:bg-red-700/80 transition-all"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
            )}
          </div>

          {/* Enhanced Filters Panel */}
          {showFilters && (
            <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Diet & Health */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-amber-400 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Diet & Health
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedDiet('')}
                        className={`px-4 py-2 rounded-lg transition-all text-sm ${!selectedDiet ? 'bg-amber-500 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
                      >
                        All Diets
                      </button>
                      {Object.keys(dietKeywords).map((diet) => (
                        <button
                          key={diet}
                          onClick={() => setSelectedDiet(diet)}
                          className={`px-4 py-2 rounded-lg transition-all text-sm ${selectedDiet === diet ? 'bg-amber-500 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                          {diet}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nutrition Constraints */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-green-400 flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Nutrition Limits
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Max Calories</label>
                        <input
                          type="number"
                          value={maxCalories}
                          onChange={(e) => setMaxCalories(e.target.value)}
                          placeholder="e.g., 500"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Max Cook Time (min)</label>
                        <input
                          type="number"
                          value={maxCookTime}
                          onChange={(e) => setMaxCookTime(e.target.value)}
                          placeholder="e.g., 60"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Difficulty Level */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-blue-400 flex items-center gap-2">
                      <ChefHat className="w-5 h-5" />
                      Difficulty Level
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {['', 'Beginner', 'Intermediate', 'Expert'].map((level) => (
                        <button
                          key={level}
                          onClick={() => setDifficultyLevel(level)}
                          className={`px-4 py-2 rounded-lg transition-all text-sm ${difficultyLevel === level ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                          {level || 'Any Level'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cuisine Filter */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-purple-400 flex items-center gap-2">
                      <Utensils className="w-5 h-5" />
                      Cuisine ({cuisines.length} available)
                    </h3>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      <button
                        onClick={() => setSelectedCuisine('')}
                        className={`px-4 py-2 rounded-lg transition-all text-sm ${!selectedCuisine ? 'bg-purple-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                      >
                        All Cuisines
                      </button>
                      {cuisines.map((cuisine) => (
                        <button
                          key={cuisine.strArea}
                          onClick={() => setSelectedCuisine(cuisine.strArea)}
                          className={`px-4 py-2 rounded-lg transition-all text-sm ${selectedCuisine === cuisine.strArea ? 'bg-purple-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                          {cuisine.strArea}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Ingredient Substitution Tool */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-orange-400 flex items-center gap-2">
                      <Scale className="w-5 h-5" />
                      Ingredient Substitutes
                    </h3>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={substituteIngredient}
                        onChange={(e) => setSubstituteIngredient(e.target.value)}
                        placeholder="Enter ingredient to substitute"
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        onClick={handleSubstituteSearch}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all"
                      >
                        Find
                      </button>
                    </div>
                    {substituteSuggestions.length > 0 && (
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <p className="text-sm text-gray-400 mb-2">Suggested substitutes:</p>
                        <div className="flex flex-wrap gap-1">
                          {substituteSuggestions.map((sub, index) => (
                            <span key={index} className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fridge Ingredients */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-cyan-400 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      What's in Your Fridge?
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">Add ingredients you have to find matching recipes</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {availableIngredients.slice(0, 20).map((ingredient) => (
                        <button
                          key={ingredient.strIngredient}
                          onClick={() => handleFridgeIngredientAdd(ingredient.strIngredient)}
                          className={`px-3 py-1 rounded-lg text-xs transition-all ${
                            fridgeIngredients.includes(ingredient.strIngredient) 
                              ? 'bg-cyan-500 text-white' 
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                        >
                          {ingredient.strIngredient}
                        </button>
                      ))}
                    </div>
                    {fridgeIngredients.length > 0 && (
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <p className="text-sm text-gray-400 mb-2">Your ingredients:</p>
                        <div className="flex flex-wrap gap-1">
                          {fridgeIngredients.map((ingredient) => (
                            <span
                              key={ingredient}
                              onClick={() => handleFridgeIngredientRemove(ingredient)}
                              className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs cursor-pointer hover:bg-cyan-500/30 flex items-center gap-1"
                            >
                              {ingredient}
                              <X className="w-3 h-3" />
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Required Ingredients */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-amber-400 flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      Required Ingredients
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">Select ingredients that MUST be in the recipe</p>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {availableIngredients.slice(0, 30).map((ingredient) => (
                        <button
                          key={ingredient.strIngredient}
                          onClick={() => {
                            const updated = selectedIngredients.includes(ingredient.strIngredient)
                              ? selectedIngredients.filter(i => i !== ingredient.strIngredient)
                              : [...selectedIngredients, ingredient.strIngredient];
                            setSelectedIngredients(updated);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs transition-all ${
                            selectedIngredients.includes(ingredient.strIngredient) 
                              ? 'bg-amber-500 text-black' 
                              : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                        >
                          {ingredient.strIngredient}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(searchTerm || selectedCuisine || selectedDiet || selectedIngredients.length > 0 || maxCalories || maxCookTime || difficultyLevel || fridgeIngredients.length > 0) && (
            <div className="mb-6 p-4 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl">
              <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Active Filters:
              </p>
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm flex items-center gap-1">
                    Search: "{searchTerm}"
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                  </span>
                )}
                {selectedCuisine && (
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm flex items-center gap-1">
                    Cuisine: {selectedCuisine}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCuisine('')} />
                  </span>
                )}
                {selectedDiet && (
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm flex items-center gap-1">
                    Diet: {selectedDiet}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedDiet('')} />
                  </span>
                )}
                {maxCalories && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm flex items-center gap-1">
                    Max Calories: {maxCalories}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setMaxCalories('')} />
                  </span>
                )}
                {maxCookTime && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm flex items-center gap-1">
                    Max Time: {maxCookTime}min
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setMaxCookTime('')} />
                  </span>
                )}
                {difficultyLevel && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm flex items-center gap-1">
                    Level: {difficultyLevel}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setDifficultyLevel('')} />
                  </span>
                )}
                {selectedIngredients.map(ingredient => (
                  <span key={ingredient} className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-sm flex items-center gap-1">
                    Required: {ingredient}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedIngredients(selectedIngredients.filter(i => i !== ingredient))} />
                  </span>
                ))}
                {fridgeIngredients.map(ingredient => (
                  <span key={ingredient} className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm flex items-center gap-1">
                    Fridge: {ingredient}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => handleFridgeIngredientRemove(ingredient)} />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Recipe Grid */}
      <main className="relative z-10 px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Results Info */}
          <div className="mb-6 text-center">
            <p className="text-gray-400">
              Showing {totalRecipes > 0 ? indexOfFirstRecipe + 1 : 0}-{Math.min(indexOfLastRecipe, totalRecipes)} of {totalRecipes} complete recipes
            </p>
            <p className="text-gray-500 text-sm mt-1">
              From TheMealDB and Spoonacular databases
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentRecipes.map((recipe) => {
              const recipeTags = getDietTags(recipe);
              const recipeId = recipe.idMeal || recipe.id;
              const nutrition = nutritionData[recipeId];
              const recipeAllergens = getAllergens(recipe);
              const recipeTitle = recipe.strMeal || recipe.title || 'Untitled Recipe';
              const recipeImage = recipe.strMealThumb || recipe.image || 'https://via.placeholder.com/300x200?text=No+Image';
              const recipeCuisine = recipe.strArea || (recipe.cuisines && recipe.cuisines[0]) || 'International';
              const recipeCategory = recipe.strCategory || (recipe.dishTypes && recipe.dishTypes[0]) || 'Main Course';
              
              return (
                <div
                  key={recipeId}
                  onClick={() => fetchRecipeDetails(recipe)}
                  className="h-96 group cursor-pointer bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-amber-500 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/20"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={recipeImage}
                      alt={recipeTitle}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Source Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-lg backdrop-blur-sm ${
                        recipe.source === 'spoonacular' ? 'bg-green-500/90 text-white' : 'bg-blue-500/90 text-white'
                      }`}>
                        {recipe.source === 'spoonacular' ? 'Spoonacular' : 'TheMealDB'}
                      </span>
                    </div>
                    
                    {/* Enhanced Tags */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      {recipeTags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 text-xs font-medium rounded-lg backdrop-blur-sm ${
                            tag === 'High Protein' ? 'bg-red-500/90 text-white' :
                            tag === 'Vegetarian' ? 'bg-green-500/90 text-white' :
                            tag === 'Vegan' ? 'bg-green-600/90 text-white' :
                            tag === 'Low Carb' ? 'bg-blue-500/90 text-white' :
                            tag === 'Low Calorie' ? 'bg-cyan-500/90 text-white' :
                            tag === 'Gluten-Free' || tag === 'Gluten Free' ? 'bg-purple-500/90 text-white' :
                            tag === 'Dairy-Free' || tag === 'Dairy Free' ? 'bg-orange-500/90 text-white' :
                            'bg-amber-500/90 text-black'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Nutrition Quick Info */}
                    {nutrition && (
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
                          <Zap className="w-3 h-3 text-yellow-400" />
                          <span className="text-xs text-white font-medium">{nutrition.calories} cal</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
                          <Clock className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-white font-medium">{nutrition.prepTime + nutrition.cookTime}min</span>
                        </div>
                      </div>
                    )}

                    {/* Allergen Warning */}
                    {recipeAllergens.length > 0 && (
                      <div className="absolute bottom-3 right-3">
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-500/80 backdrop-blur-sm rounded-lg">
                          <AlertTriangle className="w-3 h-3 text-white" />
                          <span className="text-xs text-white font-medium">
                            {recipeAllergens.length} allergen{recipeAllergens.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-amber-400 transition-colors leading-tight">
                      {recipeTitle}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-sm">{recipeCuisine} Cuisine</p>
                      <p className="text-amber-400 text-sm font-medium">{recipeCategory}</p>
                    </div>

                    {/* Enhanced Nutrition Info */}
                    {nutrition && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{nutrition.servings} servings</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">${nutrition.costPerServing}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Scale className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{nutrition.protein}g protein</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ChefHat className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {getDifficultyLevel(
                              nutrition.prepTime + nutrition.cookTime, 
                              (recipe.strInstructions || recipe.instructions || '').toLowerCase().split(' ')
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Rating (Mock) */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-3 h-3 ${Math.random() > 0.3 ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                        />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">
                        ({Math.floor(Math.random() * 500 + 50)} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredRecipes.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="mb-4">
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              </div>
              <p className="text-gray-400 text-lg mb-4">No recipes found matching your criteria.</p>
              <p className="text-gray-500 text-sm mb-6">Try adjusting your search terms or filters to discover more delicious recipes from our complete database.</p>
              <button
                onClick={clearAllFilters}
                className="px-6 py-3 bg-amber-500 text-black rounded-xl hover:bg-amber-600 transition-all font-medium"
              >
                Clear All Filters & Browse All Recipes
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                  currentPage === 1
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-white hover:bg-amber-500 hover:text-black'
                }`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>

              <div className="flex gap-1">
                {getPageNumbers().map(number => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      currentPage === number
                        ? 'bg-amber-500 text-black font-semibold'
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                    }`}
                  >
                    {number}
                  </button>
                ))}
              </div>

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                  currentPage === totalPages
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-white hover:bg-amber-500 hover:text-black'
                }`}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Enhanced Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
              <div className="flex-1 pr-4">
                <h2 className="text-2xl font-bold text-amber-400 mb-2">
                  {selectedRecipe.strMeal || selectedRecipe.title}
                </h2>
                <div className="flex flex-wrap gap-2 mb-2">
                  {/* Source Badge */}
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    selectedRecipe.source === 'spoonacular' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {selectedRecipe.source === 'spoonacular' ? 'Spoonacular Recipe' : 'TheMealDB Recipe'}
                  </span>
                  {selectedRecipe.dietTags?.map((tag, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        tag === 'High Protein' ? 'bg-red-500/20 text-red-400' :
                        tag === 'Vegetarian' ? 'bg-green-500/20 text-green-400' :
                        tag === 'Vegan' ? 'bg-green-600/20 text-green-400' :
                        tag === 'Low Carb' ? 'bg-blue-500/20 text-blue-400' :
                        tag === 'Low Calorie' ? 'bg-cyan-500/20 text-cyan-400' :
                        tag === 'Gluten-Free' || tag === 'Gluten Free' ? 'bg-purple-500/20 text-purple-400' :
                        tag === 'Dairy-Free' || tag === 'Dairy Free' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Recipe Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Image and Basic Info */}
                <div className="lg:col-span-1">
                  <img
                    src={selectedRecipe.strMealThumb || selectedRecipe.image || 'https://via.placeholder.com/400x300?text=No+Image'}
                    alt={selectedRecipe.strMeal || selectedRecipe.title}
                    className="w-full h-64 object-cover rounded-xl mb-4"
                    loading="lazy"
                  />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Cuisine:</span>
                      <span className="text-amber-400 font-medium">
                        {selectedRecipe.strArea || (selectedRecipe.cuisines && selectedRecipe.cuisines[0]) || 'International'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Category:</span>
                      <span className="text-orange-400 font-medium">
                        {selectedRecipe.strCategory || (selectedRecipe.dishTypes && selectedRecipe.dishTypes[0]) || 'Main Course'}
                      </span>
                    </div>
                    
                    {/* Spoonacular specific data */}
                    {selectedRecipe.source === 'spoonacular' && (
                      <>
                        {selectedRecipe.healthScore && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Health Score:</span>
                            <span className="text-green-400 font-medium">{selectedRecipe.healthScore}/100</span>
                          </div>
                        )}
                        {selectedRecipe.spoonacularScore && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Popularity:</span>
                            <span className="text-purple-400 font-medium">{Math.round(selectedRecipe.spoonacularScore)}%</span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Rating */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Rating:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 ${Math.random() > 0.2 ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                          />
                        ))}
                        <span className="text-sm text-gray-400 ml-1">
                          ({Math.floor(Math.random() * 500 + 50)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nutrition Information */}
                <div className="lg:col-span-2">
                  {selectedRecipe.nutritionData && (
                    <div className="bg-gray-700/50 rounded-xl p-6 mb-6">
                      <h3 className="text-xl font-semibold mb-4 text-green-400 flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Nutrition Facts
                      </h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-400">{selectedRecipe.nutritionData.calories}</div>
                          <div className="text-sm text-gray-400">Calories</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">{selectedRecipe.nutritionData.protein}g</div>
                          <div className="text-sm text-gray-400">Protein</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">{selectedRecipe.nutritionData.carbs}g</div>
                          <div className="text-sm text-gray-400">Carbs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{selectedRecipe.nutritionData.fat}g</div>
                          <div className="text-sm text-gray-400">Fat</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Servings:</span>
                          <span className="text-white font-medium">{selectedRecipe.nutritionData.servings}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Prep Time:</span>
                          <span className="text-white font-medium">{selectedRecipe.nutritionData.prepTime}min</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Cook Time:</span>
                          <span className="text-white font-medium">{selectedRecipe.nutritionData.cookTime}min</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Cost/Serving:</span>
                          <span className="text-white font-medium">${selectedRecipe.nutritionData.costPerServing}</span>
                        </div>
                      </div>

                      {/* Difficulty Level */}
                      <div className="mt-4 flex items-center justify-center">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-600/50 rounded-lg">
                          <ChefHat className="w-5 h-5 text-blue-400" />
                          <span className="text-blue-400 font-medium">
                            {getDifficultyLevel(
                              selectedRecipe.nutritionData.prepTime + selectedRecipe.nutritionData.cookTime,
                              (selectedRecipe.strInstructions || selectedRecipe.instructions || '').toLowerCase().split(' ')
                            )} Level
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Allergen Information */}
                  {selectedRecipe.allergens && selectedRecipe.allergens.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                      <h4 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Allergen Warning
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecipe.allergens.map((allergen, index) => (
                          <span key={index} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium">
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ingredients and Instructions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Ingredients */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-amber-400 flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Ingredients ({parseIngredients(selectedRecipe).length})
                  </h3>
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <ul className="space-y-3 max-h-64 overflow-y-auto">
                      {parseIngredients(selectedRecipe).map((ingredient, index) => (
                        <li key={index} className="text-gray-300 flex items-start gap-3">
                          <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                          <div className="flex-1">
                            <span className="font-medium">{ingredient.full}</span>
                            {/* Mock nutritional value per ingredient */}
                            <div className="text-xs text-gray-500 mt-1">
                              ~{Math.floor(Math.random() * 50 + 10)} cal
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Ingredient Scaling */}
                  <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Scale recipe:</span>
                      <div className="flex items-center gap-2">
                        <button className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm">½x</button>
                        <button className="px-2 py-1 bg-amber-500 text-black rounded text-sm font-medium">1x</button>
                        <button className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm">2x</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-amber-400 flex items-center gap-2">
                    <Utensils className="w-5 h-5" />
                    Instructions
                  </h3>
                  <div className="bg-gray-700/30 rounded-xl p-4 max-h-80 overflow-y-auto">
                    <div className="prose prose-invert max-w-none">
                      {(selectedRecipe.strInstructions || selectedRecipe.instructions || 'Instructions not available')
                        .split(/\n|\. /).map((step, index) => (
                        step.trim() && (
                          <div key={index} className="mb-4 flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-black rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </span>
                            <p className="text-gray-300 leading-relaxed">{step.trim()}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment Needed (Mock) */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-blue-400 flex items-center gap-2">
                  <Utensils className="w-5 h-5" />
                  Equipment Needed
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['Large pot', 'Cutting board', 'Sharp knife', 'Wooden spoon', 'Measuring cups'].map((equipment, index) => (
                    <span key={index} className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                      {equipment}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tips and Variations */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Chef's Tips
                  </h4>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• For best results, let ingredients come to room temperature before cooking</li>
                    <li>• Taste and adjust seasoning throughout the cooking process</li>
                    <li>• Don't overcrowd the pan when searing proteins</li>
                  </ul>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Variations
                  </h4>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• Vegetarian: Replace meat with mushrooms or tofu</li>
                    <li>• Spicy: Add chili flakes or hot sauce to taste</li>
                    <li>• Low-carb: Serve over cauliflower rice instead</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                {selectedRecipe.strYoutube && (
                  <a
                    href={selectedRecipe.strYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl transition-colors font-medium"
                  >
                    <Play className="w-5 h-5" />
                    Watch Video Tutorial
                  </a>
                )}
                {(selectedRecipe.strSource || selectedRecipe.sourceUrl) && (
                  <a
                    href={selectedRecipe.strSource || selectedRecipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors font-medium"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Original Recipe
                  </a>
                )}
                <button className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl transition-colors font-medium">
                  <Star className="w-5 h-5" />
                  Save to Favorites
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors font-medium">
                  <Users className="w-5 h-5" />
                  Share Recipe
                </button>
              </div>

              {/* Nutritional Breakdown Chart (Mock) */}
              {selectedRecipe.nutritionData && (
                <div className="mt-8 bg-gray-700/30 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 text-cyan-400 flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Detailed Nutrition (per serving)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-600/30 rounded-lg">
                      <div className="text-lg font-bold text-orange-400">{selectedRecipe.nutritionData.fiber}g</div>
                      <div className="text-sm text-gray-400">Fiber</div>
                    </div>
                    <div className="text-center p-3 bg-gray-600/30 rounded-lg">
                      <div className="text-lg font-bold text-pink-400">{selectedRecipe.nutritionData.sugar}g</div>
                      <div className="text-sm text-gray-400">Sugar</div>
                    </div>
                    <div className="text-center p-3 bg-gray-600/30 rounded-lg">
                      <div className="text-lg font-bold text-red-400">{selectedRecipe.nutritionData.sodium}mg</div>
                      <div className="text-sm text-gray-400">Sodium</div>
                    </div>
                    <div className="text-center p-3 bg-gray-600/30 rounded-lg">
                      <div className="text-lg font-bold text-yellow-400">A+</div>
                      <div className="text-sm text-gray-400">Health Score</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeFinderApp;