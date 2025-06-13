import React, { useState, useRef, useEffect } from 'react';
import { 
  getDatabase, 
  ref, 
  onValue, 
  push, 
  update, 
  remove, 
  get, 
  query, 
  orderByChild, 
  serverTimestamp 
} from 'firebase/database';
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { 
  FiShoppingBag, 
  FiSearch, 
  FiFilter, 
  FiPlus, 
  FiBook, 
  FiZap, 
  FiTarget, 
  FiTag, 
  FiAward, 
  FiMoreHorizontal, 
  FiHeart, 
  FiMessageCircle, 
  FiShare, 
  FiTrash2, 
  FiEdit, 
  FiEye, 
  FiImage, 
  FiArrowLeft,
  FiCheck,
  FiX,
  FiDollarSign,
  FiMapPin,
  FiAlertCircle,
  FiGrid,
  FiList
} from 'react-icons/fi';
import { useCallback } from 'react';

const useMaintainInputFocus = () => {
  // Track input elements and their selection positions
  const inputStateRef = useRef({
    element: null,
    selectionStart: null,
    selectionEnd: null
  });
  
  // Save the current focus state before render
  const saveFocusState = useCallback(() => {
    const activeElement = document.activeElement;
    
    if (activeElement && ['INPUT', 'TEXTAREA'].includes(activeElement.tagName)) {
      inputStateRef.current = {
        element: activeElement,
        selectionStart: 'selectionStart' in activeElement ? activeElement.selectionStart : null,
        selectionEnd: 'selectionEnd' in activeElement ? activeElement.selectionEnd : null
      };
    }
  }, []);
  
  // Restore focus after render
  const restoreFocusState = useCallback(() => {
    const { element, selectionStart, selectionEnd } = inputStateRef.current;
    
    if (element && document.contains(element)) {
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        element.focus();
        
        // Restore cursor position if available
        if (selectionStart !== null && selectionEnd !== null && 
            'setSelectionRange' in element) {
          element.setSelectionRange(selectionStart, selectionEnd);
        }
      });
    }
  }, []);
  
  // Setup the effect to run on every render
  useEffect(() => {
    saveFocusState();
    return restoreFocusState;
  });
  
  // Return functions for manual use if needed
  return { saveFocusState, restoreFocusState };
};

const MarketPlace = () => {
  useMaintainInputFocus();
  
  // State variables
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 });
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showItemDetailModal, setShowItemDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'price-low', 'price-high'
  
  // New item state
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: '',
    category: 'books',
    condition: 'good',
    imageFile: null,
    contactInfo: '',
    location: '',
    isNegotiable: true
  });
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [userCollege, setUserCollege] = useState(null);
  const [showOnlyCollege, setShowOnlyCollege] = useState(false);
  
  const db = getDatabase();
  const firestore = getFirestore();
  
  // Marketplace Categories
  const marketplaceCategories = [
    { value: 'all', label: 'All Items', icon: FiShoppingBag },
    { value: 'books', label: 'Books & Study Material', icon: FiBook },
    { value: 'electronics', label: 'Electronics & Gadgets', icon: FiZap },
    { value: 'furniture', label: 'Furniture & Decor', icon: FiTarget },
    { value: 'clothing', label: 'Clothing & Fashion', icon: FiTag },
    { value: 'sports', label: 'Sports & Fitness', icon: FiAward },
    { value: 'other', label: 'Other Items', icon: FiMoreHorizontal }
  ];

  // Product Conditions
  const productConditions = [
    { value: 'new', label: 'Brand New', color: 'green' },
    { value: 'excellent', label: 'Excellent', color: 'blue' },
    { value: 'good', label: 'Good', color: 'yellow' },
    { value: 'fair', label: 'Fair', color: 'orange' },
    { value: 'poor', label: 'Poor', color: 'red' }
  ];

  // Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(firestore, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserDetails(userData);
          setUserCollege(userData.college || null);
        }
      } else {
        setUserDetails(null);
        setUserCollege(null);
      }
    });
    
    return () => unsubscribe();
  }, [firestore]);
  
  // Dark mode detection
  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);

    const handleThemeChange = (e) => {
      setIsDarkMode(e.matches);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  // Fetch marketplace items
  useEffect(() => {
    setIsLoading(true);
    const fetchMarketplaceItems = async () => {
      const itemsRef = ref(db, 'marketplace');
      onValue(itemsRef, async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const itemsArray = await Promise.all(
            Object.entries(data).map(async ([id, item]) => {
              let sellerDetails = null;
              
              try {
                if (item.sellerId) {
                  const userRef = doc(firestore, "users", item.sellerId);
                  const userSnap = await getDoc(userRef);
                  
                  if (userSnap.exists()) {
                    sellerDetails = userSnap.data();
                  }
                }
              } catch (error) {
                console.error("Error fetching seller details:", error);
              }
              
              return {
                id,
                ...item,
                price: parseFloat(item.price) || 0,
                sellerDetails,
                createdAt: item.createdAt || { seconds: 0 }
              };
            })
          );
          
          setMarketplaceItems(itemsArray.filter(item => item !== null));
        } else {
          setMarketplaceItems([]);
        }
        setIsLoading(false);
      });
    };

    fetchMarketplaceItems();
  }, [db, firestore]);
  
  // Apply filters
  useEffect(() => {
    let filtered = [...marketplaceItems];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Filter by availability
    if (showOnlyAvailable) {
      filtered = filtered.filter(item => item.status !== 'sold');
    }
    
    // Filter by college
    if (showOnlyCollege && userCollege) {
      filtered = filtered.filter(item => item.sellerDetails?.college === userCollege);
    }
    
    // Filter by price range
    filtered = filtered.filter(item => 
      item.price >= priceRange.min && item.price <= priceRange.max
    );
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.sellerDetails?.fullName?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    if (sortBy === 'recent') {
      filtered.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
    } else if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    }
    
    setFilteredItems(filtered);
  }, [marketplaceItems, selectedCategory, searchQuery, priceRange, showOnlyAvailable, userCollege, showOnlyCollege, sortBy]);
  
  // Item actions handlers
  const handleAddMarketplaceItem = async () => {
    if (!user) {
      alert("You must be logged in to sell items.");
      return;
    }

    if (!newItem.title || !newItem.price || !newItem.description) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setUploading(true);
      let imageUrl = null;
      
      // Upload image if it exists
      if (newItem.imageFile) {
        const storage = getStorage();
        const imageId = uuidv4();
        const imageRef = storageRef(storage, `marketplace/${user.uid}/${imageId}`);
        
        await uploadBytes(imageRef, newItem.imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }
      
      const itemsRef = ref(db, 'marketplace');
      const itemData = {
        title: newItem.title,
        description: newItem.description,
        price: newItem.price,
        category: newItem.category,
        condition: newItem.condition,
        imageUrl,
        contactInfo: newItem.contactInfo,
        location: newItem.location,
        isNegotiable: newItem.isNegotiable,
        sellerId: user.uid,
        createdAt: serverTimestamp(),
        status: 'available',
        views: 0,
        favorites: {}
      };
      
      await push(itemsRef, itemData);
      
      // Reset form
      setNewItem({
        title: '',
        description: '',
        price: '',
        category: 'books',
        condition: 'good',
        imageFile: null,
        contactInfo: '',
        location: '',
        isNegotiable: true
      });
      setImagePreview(null);
      setShowAddItemModal(false);
      
    } catch (error) {
      console.error("Failed to add item:", error);
      alert("Failed to add item. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleMarkAsSold = async (itemId) => {
    if (!user) return;
    
    const itemRef = ref(db, `marketplace/${itemId}`);
    try {
      await update(itemRef, { status: 'sold' });
    } catch (error) {
      console.error("Failed to mark as sold:", error);
    }
  };

  const handleDeleteItem = async (itemId, sellerId) => {
    if (!user || user.uid !== sellerId) {
      alert("You can only delete your own items.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        // Delete image from storage if it exists
        const item = marketplaceItems.find(item => item.id === itemId);
        if (item.imageUrl) {
          const storage = getStorage();
          // Extract the image path from the URL
          const imageUrlPath = item.imageUrl.split('marketplace/')[1];
          if (imageUrlPath) {
            const imgRef = storageRef(storage, `marketplace/${imageUrlPath}`);
            try {
              await deleteObject(imgRef);
            } catch (error) {
              console.error("Error deleting image:", error);
            }
          }
        }
        
        // Delete item data
        const itemRef = ref(db, `marketplace/${itemId}`);
        await remove(itemRef);
        
        // Close detail modal if open
        if (selectedItem && selectedItem.id === itemId) {
          setShowItemDetailModal(false);
          setSelectedItem(null);
        }
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
    }
  };

  const handleToggleFavorite = async (itemId) => {
    if (!user) {
      alert("You must be logged in to favorite items.");
      return;
    }

    const favRef = ref(db, `marketplace/${itemId}/favorites/${user.uid}`);
    const snapshot = await get(favRef);
    
    try {
      if (snapshot.exists()) {
        await update(ref(db, `marketplace/${itemId}/favorites`), { [user.uid]: null });
      } else {
        await update(ref(db, `marketplace/${itemId}/favorites`), { [user.uid]: true });
      }
    } catch (error) {
      console.error("Failed to update favorites:", error);
    }
  };

  const handleViewItem = async (item) => {
    setSelectedItem(item);
    setShowItemDetailModal(true);
    
    // Increment view count
    const viewRef = ref(db, `marketplace/${item.id}/views`);
    const snapshot = await get(viewRef);
    const currentViews = snapshot.val() || 0;
    
    try {
      await update(ref(db, `marketplace/${item.id}`), { views: currentViews + 1 });
    } catch (error) {
      console.error("Failed to update views:", error);
    }
  };
  
  // Image handling
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert("Please select an image smaller than 5MB");
        return;
      }
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Store the file in the newItem state
      setNewItem({ ...newItem, imageFile: file });
    }
  };
  
  const handleRemoveImage = () => {
    setImagePreview(null);
    setNewItem({ ...newItem, imageFile: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setPriceRange({ min: 0, max: 50000 });
    setShowOnlyAvailable(true);
    setShowOnlyCollege(false);
  };

  // Components
  const ItemCard = ({ item }) => {
    const condition = productConditions.find(c => c.value === item.condition) || { label: 'Unknown', color: 'gray' };
    const isOwner = user?.uid === item.sellerId;
    const isFavorited = item.favorites?.[user?.uid];
    const category = marketplaceCategories.find(c => c.value === item.category) || marketplaceCategories[0];
    const Icon = category.icon;

    if (viewMode === 'grid') {
      return (
        <div className="bg-white dark:bg-black rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg dark:hover:shadow-xl transition-all duration-300">
          {/* Card Image */}
          <div 
            className="w-full h-48 bg-gray-100 dark:bg-gray-900 cursor-pointer relative"
            onClick={() => handleViewItem(item)}
          >
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-item.png';
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Icon className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-500">No image</p>
              </div>
            )}
            
            {/* Status badge */}
            {item.status === 'sold' && (
              <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 m-2 rounded-full text-xs font-bold">
                SOLD
              </div>
            )}
            
            {/* Category badge */}
            <div className="absolute bottom-0 left-0 bg-black/60 text-white px-3 py-1 m-2 rounded-full text-xs font-medium flex items-center space-x-1">
              <Icon className="w-3 h-3" />
              <span>{category.label.split(' ')[0]}</span>
            </div>
          </div>
          
          {/* Card Content */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{item.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${condition.color}-100 dark:bg-${condition.color}-900/30 text-${condition.color}-700 dark:text-${condition.color}-300`}>
                {condition.label}
              </span>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                ₹{parseInt(item.price).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-1">
                <img
                  src={item.sellerDetails?.avatar || "/default-avatar.png"}
                  alt="Seller"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[80px]">
                  {item.sellerDetails?.username || "Unknown"}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(item.id);
                  }}
                  className={`p-1.5 rounded-full transition-colors ${
                    isFavorited 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400'
                  }`}
                >
                  <FiHeart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
                
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id, item.sellerId);
                    }}
                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // List view
      return (
        <div 
          className="bg-white dark:bg-black rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md dark:hover:shadow-xl transition-all duration-300 flex cursor-pointer"
          onClick={() => handleViewItem(item)}
        >
          {/* Image */}
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-900 flex-shrink-0 relative">
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-item.png';
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Icon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
            )}
            
            {item.status === 'sold' && (
              <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-0.5 m-1 rounded-full text-xxs font-bold">
                SOLD
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{item.title}</h3>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xxs font-medium bg-${condition.color}-100 dark:bg-${condition.color}-900/30 text-${condition.color}-700 dark:text-${condition.color}-300 flex-shrink-0`}>
                  {condition.label}
                </span>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-1">
                {item.description}
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-auto">
              <div className="text-base font-bold text-green-600 dark:text-green-400">
                ₹{parseInt(item.price).toLocaleString()}
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                  <FiEye className="w-3 h-3" />
                  <span>{item.views || 0}</span>
                </span>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(item.id);
                  }}
                  className={`p-1 transition-colors ${
                    isFavorited 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400'
                  }`}
                >
                  <FiHeart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const ItemDetailModal = () => {
    if (!selectedItem || !showItemDetailModal) return null;
    
    const condition = productConditions.find(c => c.value === selectedItem.condition) || { label: 'Unknown', color: 'gray' };
    const isOwner = user?.uid === selectedItem.sellerId;
    const isFavorited = selectedItem.favorites?.[user?.uid];
    const category = marketplaceCategories.find(c => c.value === selectedItem.category) || marketplaceCategories[0];
    const Icon = category.icon;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-black rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-black z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => {
                setShowItemDetailModal(false);
                setSelectedItem(null);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="flex items-center space-x-2">
              {isOwner && selectedItem.status === 'available' && (
                <button
                  onClick={() => handleMarkAsSold(selectedItem.id)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  Mark as Sold
                </button>
              )}
              
              {isOwner && (
                <button
                  onClick={() => handleDeleteItem(selectedItem.id, selectedItem.sellerId)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {/* Item Image */}
            <div className="mb-6 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
              {selectedItem.imageUrl ? (
                <img 
                  src={selectedItem.imageUrl} 
                  alt={selectedItem.title}
                  className="w-full max-h-80 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-item.png';
                  }}
                />
              ) : (
                <div className="w-full h-64 flex flex-col items-center justify-center">
                  <Icon className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-500">No image available</p>
                </div>
              )}
              
              {selectedItem.status === 'sold' && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-1 rounded-full font-bold">
                  SOLD
                </div>
              )}
            </div>
            
            {/* Item Details */}
            <div className="flex flex-col md:flex-row md:space-x-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedItem.title}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${condition.color}-100 dark:bg-${condition.color}-900/30 text-${condition.color}-700 dark:text-${condition.color}-300`}>
                    {condition.label}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 mb-6">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{parseInt(selectedItem.price).toLocaleString()}
                  </div>
                  
                  {selectedItem.isNegotiable && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                      Negotiable
                    </span>
                  )}
                </div>
                
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {selectedItem.description || "No description provided."}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Category</h3>
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                      <Icon className="w-5 h-5" />
                      <span>{category.label}</span>
                    </div>
                  </div>
                  
                  {selectedItem.location && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Location</h3>
                      <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                        <FiMapPin className="w-5 h-5" />
                        <span>{selectedItem.location}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mb-6">
                  <div className="flex justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 text-sm">
                        <FiEye className="w-4 h-4" />
                        <span>{selectedItem.views || 0} views</span>
                      </span>
                      
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        Posted {selectedItem.createdAt?.seconds 
                          ? new Date(selectedItem.createdAt.seconds * 1000).toLocaleDateString() 
                          : 'Recently'}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleToggleFavorite(selectedItem.id)}
                      className={`flex items-center space-x-1 ${
                        isFavorited 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                      }`}
                    >
                      <FiHeart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                      <span className="text-sm">
                        {Object.keys(selectedItem.favorites || {}).length}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Seller Info */}
              <div className="md:w-64 flex-shrink-0 md:border-l md:border-gray-200 md:dark:border-gray-800 md:pl-6 mt-6 md:mt-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Seller Information</h3>
                
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={selectedItem.sellerDetails?.avatar || "/default-avatar.png"}
                    alt="Seller"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100 dark:ring-blue-900"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {selectedItem.sellerDetails?.fullName || "Unknown Seller"}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{selectedItem.sellerDetails?.username || "unknown"}
                    </p>
                  </div>
                </div>
                
                {selectedItem.sellerDetails?.college && (
                  <div className="mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">College:</span> {selectedItem.sellerDetails.college}
                    </p>
                  </div>
                )}
                
                {!isOwner && (
                  <div className="space-y-3">
                    {selectedItem.contactInfo && (
                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Contact:</span> {selectedItem.contactInfo}
                        </p>
                      </div>
                    )}
                    
                    <button
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                      onClick={() => {
                        // In a real app, this would open a chat with the seller
                        alert("Contact functionality would be implemented here!");
                      }}
                    >
                      <FiMessageCircle className="w-5 h-5" />
                      <span>Contact Seller</span>
                    </button>
                    
                    <button
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                      onClick={() => {
                        navigator.share({
                          title: selectedItem.title,
                          text: `Check out this item: ${selectedItem.title}`,
                          url: window.location.href,
                        }).catch((error) => console.log('Error sharing', error));
                      }}
                    >
                      <FiShare className="w-5 h-5" />
                      <span>Share Listing</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AddItemModal = () => {
    if (!showAddItemModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-black rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sell Your Item</h2>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Title *
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => {
                    // Prevent event propagation
                    e.stopPropagation();
                    // Use functional state update
                    setNewItem(prev => ({ ...prev, title: e.target.value }));
                  }}
                  // Prevent blur on click
                  onClick={(e) => e.stopPropagation()}
                  className="w-full p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter item title..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  rows="4"
                  className="w-full p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe your item..."
                />
              </div>

              {/* Price and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price (₹) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiDollarSign className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      className="w-full p-3 pl-10 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="negotiable"
                      checked={newItem.isNegotiable}
                      onChange={(e) => setNewItem({ ...newItem, isNegotiable: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="negotiable" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      Price is negotiable
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {marketplaceCategories.slice(1).map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Condition
                </label>
                <div className="flex flex-wrap gap-2">
                  {productConditions.map(condition => (
                    <button
                      key={condition.value}
                      onClick={() => setNewItem({ ...newItem, condition: condition.value })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        newItem.condition === condition.value
                          ? `bg-${condition.color}-100 dark:bg-${condition.color}-900/30 text-${condition.color}-700 dark:text-${condition.color}-300 border-2 border-${condition.color}-500`
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {condition.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    className="w-full p-3 pl-10 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. North Campus, Library Building"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Information
                </label>
                <input
                  type="text"
                  value={newItem.contactInfo}
                  onChange={(e) => setNewItem({ ...newItem, contactInfo: e.target.value })}
                  className="w-full p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Phone number, email, or other contact details..."
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Image
                </label>
                
                {imagePreview ? (
                  <div className="relative mb-4">
                    <img 
                      src={imagePreview} 
                      alt="Item preview" 
                      className="w-full h-64 object-contain bg-gray-100 dark:bg-gray-900 rounded-xl"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                  >
                    <FiImage className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 mb-1">Click to upload an image of your item</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMarketplaceItem}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-2"
                disabled={uploading || !newItem.title || !newItem.price || !newItem.description}
              >
                {uploading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                )}
                <span>List Item</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FilterPanel = () => {
    return (
      <div className={`bg-white dark:bg-black rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-300 overflow-hidden ${showFilters ? 'mb-6' : 'mb-2'}`}>
        <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
          <div className="flex items-center space-x-2">
            <FiFilter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Filters</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredItems.length} items
            </span>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              {showFilters ? 
                <FiArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" /> :
                <FiFilter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              }
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</h4>
                <div className="flex flex-wrap gap-2">
                  {marketplaceCategories.map(category => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.value}
                        onClick={() => setSelectedCategory(category.value)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedCategory === category.value
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{category.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Price Range</h4>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    ₹{priceRange.min} - ₹{priceRange.max}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 50000 })}
                    className="w-full p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
            
            {/* Additional filters */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="available"
                  checked={showOnlyAvailable}
                  onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="available" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Available items only
                </label>
              </div>
              
              {userCollege && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="college"
                    checked={showOnlyCollege}
                    onChange={(e) => setShowOnlyCollege(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="college" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    From my college only
                  </label>
                </div>
              )}
              
              <div className="ml-auto">
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SearchBar = () => {
    return (
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="w-full p-3 pl-10 pr-10 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200"
          placeholder="Search items, categories, or sellers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <FiX className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 bg-gray-50 dark:bg-black min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Student Marketplace</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Buy and sell items with other students
        </p>
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="md:flex-1 max-w-md">
          <SearchBar />
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white text-sm appearance-none"
            >
              <option value="recent">Most Recent</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <FiFilter className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center space-x-1 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-black text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-black text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <FiList className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={() => setShowAddItemModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <FiPlus className="w-5 h-5" />
            <span className="hidden sm:inline">Sell Item</span>
          </button>
        </div>
      </div>
      
      {/* Filters Panel */}
      <FilterPanel />
      
      {/* Main Content */}
      {isLoading ? (
        <div className="py-12 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
          {filteredItems.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <FiShoppingBag className="w-8 h-8 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No items found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery ? `No results for "${searchQuery}"` : "No items match your filters"}
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
          >
            <FiFilter className="w-4 h-4" />
            <span>Reset Filters</span>
          </button>
        </div>
      )}
      
      {/* Modals */}
      <AddItemModal />
      <ItemDetailModal />
    </div>
  );
};

export default MarketPlace;