import React, { useState, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, ShoppingBag, MessageSquare, X, Upload, Eye, Heart, Clock, MapPin, ArrowLeft, MoreVertical } from 'lucide-react';
import { db, storage } from '../Pages/firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Modal Portal Component
const Modal = memo(({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return createPortal(
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-black text-white rounded-t-3xl sm:rounded-3xl w-full sm:w-auto sm:max-w-md max-h-[95vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
});

// Item Card Component - Mobile First Design
const ItemCard = memo(({ item, onViewDetails, onContact }) => (
  <div className="bg-gray-900 rounded-3xl overflow-hidden active:scale-95 transition-all duration-200 border border-gray-800">
    <div className="relative">
      {item.imageUrl ? (
        <img 
          src={item.imageUrl || "/placeholder.svg"} 
          alt={item.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
          <div className="text-gray-500 text-center">
            <ShoppingBag size={48} />
            <p className="text-sm mt-2">No image</p>
          </div>
        </div>
      )}
      <div className="absolute top-3 left-3">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          item.condition === 'new' 
            ? 'bg-green-600 text-white' 
            : 'bg-yellow-600 text-white'
        }`}>
          {item.condition.toUpperCase()}
        </span>
      </div>
      <div className="absolute top-3 right-3">
        <span className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white">
          {item.categoryIcon}
        </span>
      </div>
    </div>
    
    <div className="p-4">
      <h3 className="font-semibold text-white mb-2 line-clamp-2 text-lg">{item.title}</h3>
      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
      
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl font-bold text-blue-400">₹{item.price?.toLocaleString()}</span>
        <button 
          onClick={() => onViewDetails(item)}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 active:scale-95 transition-all"
        >
          <Eye size={16} />
          View
        </button>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {item.sellerName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-gray-400">@{item.sellerUsername}</span>
        </div>
        <button 
          onClick={() => onContact(item)}
          className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-700 transition-colors flex items-center gap-1 active:scale-95"
        >
          <MessageSquare size={16} />
          Contact
        </button>
      </div>
    </div>
  </div>
));

// Demand Card Component
const DemandCard = memo(({ demand, onRespond }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4 active:scale-95 transition-all duration-200">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <h3 className="font-semibold text-white mb-2 text-lg">{demand.title}</h3>
        <p className="text-gray-400 text-sm mb-3">{demand.description}</p>
      </div>
      <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-medium ml-2">
        {demand.categoryIcon}
      </span>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-2">
        <span className="text-lg font-bold text-orange-400">Budget: ₹{demand.budget?.toLocaleString()}</span>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-xs">
              {demand.requesterName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-gray-400">@{demand.requesterUsername}</span>
        </div>
      </div>
      <button 
        onClick={() => onRespond(demand)}
        className="bg-orange-600 text-white px-4 py-2 rounded-full text-sm hover:bg-orange-700 transition-colors flex items-center gap-1 active:scale-95"
      >
        <MessageSquare size={16} />
        Respond
      </button>
    </div>
  </div>
));

// Item Details Modal Content
const ItemDetailsContent = memo(({ item, onClose, onContact }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-white">Item Details</h2>
      <button 
        onClick={onClose}
        className="p-2 hover:bg-gray-800 rounded-full transition-colors active:scale-95"
      >
        <X size={20} className="text-white" />
      </button>
    </div>
    
    {item.imageUrl && (
      <div className="mb-6">
        <img 
          src={item.imageUrl || "/placeholder.svg"} 
          alt={item.title}
          className="w-full h-64 object-cover rounded-2xl"
        />
      </div>
    )}
    
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-white">{item.title}</h3>
        <p className="text-gray-400 mt-2">{item.description}</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-3xl font-bold text-blue-400">₹{item.price?.toLocaleString()}</span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          item.condition === 'new' 
            ? 'bg-green-600 text-white' 
            : 'bg-yellow-600 text-white'
        }`}>
          {item.condition.toUpperCase()}
        </span>
        <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">
          {item.categoryIcon} {item.categoryName}
        </span>
      </div>
      
      <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold">
            {item.sellerName?.charAt(0)?.toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-medium text-white">{item.sellerName}</p>
          <p className="text-sm text-gray-400">@{item.sellerUsername}</p>
        </div>
      </div>
      
      <button 
        onClick={() => onContact(item)}
        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 active:scale-95"
      >
        <MessageSquare size={20} />
        Contact Seller
      </button>
    </div>
  </div>
));

// Add Item Form Content
const AddItemFormContent = memo(({ onClose, onSubmit, form, onChange, loading }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-white">Sell an Item</h2>
      <button 
        onClick={onClose}
        className="p-2 hover:bg-gray-800 rounded-full transition-colors active:scale-95"
      >
        <X size={20} className="text-white" />
      </button>
    </div>
    
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={onChange}
          className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
          placeholder="Enter item title"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 resize-none"
          rows="3"
          placeholder="Describe your item"
          required
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Price (₹)</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={onChange}
            className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
            placeholder="0"
            required
            min="0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={onChange}
            className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          >
            <option value="books">📚 Books</option>
            <option value="electronics">📱 Electronics</option>
            <option value="hostel">🏠 Hostel Items</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Condition</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="condition"
              value="new"
              checked={form.condition === 'new'}
              onChange={onChange}
              className="mr-2 accent-blue-600"
            />
            <span className="text-white">New</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="condition"
              value="used"
              checked={form.condition === 'used'}
              onChange={onChange}
              className="mr-2 accent-blue-600"
            />
            <span className="text-white">Used</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Image (Optional)</label>
        <div className="border-2 border-dashed border-gray-700 rounded-2xl p-6 text-center bg-gray-800">
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={onChange}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-400">Click to upload image</p>
          </label>
          {form.image && (
            <p className="text-sm text-green-400 mt-2">✓ {form.image.name}</p>
          )}
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 active:scale-95"
      >
        {loading ? 'Posting...' : 'Post Item'}
      </button>
    </form>
  </div>
));

// Add Demand Form Content
const AddDemandFormContent = memo(({ onClose, onSubmit, form, onChange, loading }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-white">Create Demand</h2>
      <button 
        onClick={onClose}
        className="p-2 hover:bg-gray-800 rounded-full transition-colors active:scale-95"
      >
        <X size={20} className="text-white" />
      </button>
    </div>
    
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">What are you looking for?</label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={onChange}
          className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-gray-400"
          placeholder="e.g., Looking for a table fan"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-gray-400 resize-none"
          rows="3"
          placeholder="Describe what you need in detail"
          required
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Budget (₹)</label>
          <input
            type="number"
            name="budget"
            value={form.budget}
            onChange={onChange}
            className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-gray-400"
            placeholder="Max budget"
            required
            min="0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={onChange}
            className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
          >
            <option value="books">📚 Books</option>
            <option value="electronics">📱 Electronics</option>
            <option value="hostel">🏠 Hostel Items</option>
          </select>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-600 text-white py-4 rounded-2xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 active:scale-95"
      >
        {loading ? 'Posting...' : 'Post Demand'}
      </button>
    </form>
  </div>
));

// Main MarketPlace Component
const MarketPlace = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('marketplace');
  const [items, setItems] = useState([]);
  const [demands, setDemands] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [filteredDemands, setFilteredDemands] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Form states
  const [itemForm, setItemForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'books',
    condition: 'used',
    image: null
  });

  const [demandForm, setDemandForm] = useState({
    title: '',
    description: '',
    category: 'books',
    budget: ''
  });

  const categories = [
    { id: 'all', name: 'All Categories', icon: '🛍️' },
    { id: 'books', name: 'Books', icon: '📚' },
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'hostel', name: 'Hostel Items', icon: '🏠' }
  ];

  const conditions = [
    { id: 'all', name: 'All Conditions' },
    { id: 'new', name: 'New' },
    { id: 'used', name: 'Used' }
  ];

  // Initialize user data
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      fetchItems(userData.college);
      fetchDemands(userData.college);
    }
  }, []);

  // Fetch items from Firebase
  const fetchItems = async (userCollege) => {
    try {
      const itemsRef = collection(db, 'marketplace_items');
      const q = query(
        itemsRef,
        where('college', '==', userCollege),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const itemsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const category = categories.find(cat => cat.id === data.category) || categories[0];
        return {
          id: doc.id,
          ...data,
          categoryIcon: category.icon,
          categoryName: category.name
        };
      });
      setItems(itemsData);
      setFilteredItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  // Fetch demands from Firebase
  const fetchDemands = async (userCollege) => {
    try {
      const demandsRef = collection(db, 'marketplace_demands');
      const q = query(
        demandsRef,
        where('college', '==', userCollege),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const demandsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const category = categories.find(cat => cat.id === data.category) || categories[0];
        return {
          id: doc.id,
          ...data,
          categoryIcon: category.icon,
          categoryName: category.name
        };
      });
      setDemands(demandsData);
      setFilteredDemands(demandsData);
    } catch (error) {
      console.error('Error fetching demands:', error);
    }
  };

  // Filter items based on search and filters
  useEffect(() => {
    let filtered = items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesCondition = selectedCondition === 'all' || item.condition === selectedCondition;
      
      return matchesSearch && matchesCategory && matchesCondition;
    });
    setFilteredItems(filtered);

    const filteredDemandsData = demands.filter(demand => {
      const matchesSearch = demand.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           demand.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || demand.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
    setFilteredDemands(filteredDemandsData);
  }, [searchQuery, selectedCategory, selectedCondition, items, demands]);

  // Handle image upload
  const handleImageUpload = async (file) => {
    if (!file) return null;
    
    try {
      const imageRef = ref(storage, `marketplace/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // Handle item form input changes
  const handleItemFormChange = useCallback((e) => {
    const { name, value, type, files } = e.target;
    
    setItemForm(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value
    }));
  }, []);

  // Handle demand form input changes
  const handleDemandFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setDemandForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Add new item
  const handleAddItem = useCallback(async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let imageUrl = null;
      if (itemForm.image) {
        imageUrl = await handleImageUpload(itemForm.image);
      }

      const itemData = {
        title: itemForm.title,
        description: itemForm.description,
        price: parseFloat(itemForm.price),
        category: itemForm.category,
        condition: itemForm.condition,
        imageUrl: imageUrl,
        sellerId: user.email,
        sellerName: user.fullName,
        sellerUsername: user.username,
        college: user.college,
        createdAt: serverTimestamp(),
        isActive: true
      };

      await addDoc(collection(db, 'marketplace_items'), itemData);
      
      setItemForm({
        title: '',
        description: '',
        price: '',
        category: 'books',
        condition: 'used',
        image: null
      });
      setShowAddModal(false);
      
      fetchItems(user.college);
    } catch (error) {
      console.error('Error adding item:', error);
    }
    setLoading(false);
  }, [itemForm, user]);

  // Add new demand
  const handleAddDemand = useCallback(async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const demandData = {
        title: demandForm.title,
        description: demandForm.description,
        category: demandForm.category,
        budget: parseFloat(demandForm.budget),
        requesterId: user.email,
        requesterName: user.fullName,
        requesterUsername: user.username,
        college: user.college,
        createdAt: serverTimestamp(),
        isActive: true,
        responses: []
      };

      await addDoc(collection(db, 'marketplace_demands'), demandData);
      
      setDemandForm({
        title: '',
        description: '',
        category: 'books',
        budget: ''
      });
      setShowDemandModal(false);
      
      fetchDemands(user.college);
    } catch (error) {
      console.error('Error adding demand:', error);
    }
    setLoading(false);
  }, [demandForm, user]);

  // Contact seller function - Updated to use inbuilt chat
  const handleContactSeller = useCallback(async (item) => {
    if (!user) return;
    
    try {
      // Check if chat room already exists between current user and seller
      const existingChatQuery = query(
        collection(db, 'chatRooms'),
        where('users', 'array-contains', user.email)
      );
      
      const existingChats = await getDocs(existingChatQuery);
      let existingChatRoom = null;
      
      // Find existing chat with this seller
      existingChats.forEach(doc => {
        const chatData = doc.data();
        if (chatData.users.includes(item.sellerId)) {
          existingChatRoom = { id: doc.id, ...chatData };
        }
      });
      
      if (existingChatRoom) {
        // Navigate to existing chat
        navigate(`/chat/${existingChatRoom.id}`);
      } else {
        // Create new chat room
        const newChatRoomRef = await addDoc(collection(db, 'chatRooms'), {
          users: [user.email, item.sellerId],
          messages: [],
          createdAt: serverTimestamp(),
          lastMessage: '',
          lastMessageTimestamp: serverTimestamp(),
          lastActivity: serverTimestamp()
        });
        
        // Navigate to new chat
        navigate(`/chat/${newChatRoomRef.id}`);
      }
    } catch (error) {
      console.error('Error creating/accessing chat:', error);
      // Fallback to WhatsApp if chat creation fails
      const message = `Hi! I'm interested in your ${item.title} posted on HiiHive marketplace. Is it still available?`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  }, [user, navigate]);

  // Respond to demand function - Updated to use inbuilt chat
  const handleRespondToDemand = useCallback(async (demand) => {
    if (!user) return;
    
    try {
      // Check if chat room already exists between current user and requester
      const existingChatQuery = query(
        collection(db, 'chatRooms'),
        where('users', 'array-contains', user.email)
      );
      
      const existingChats = await getDocs(existingChatQuery);
      let existingChatRoom = null;
      
      // Find existing chat with this requester
      existingChats.forEach(doc => {
        const chatData = doc.data();
        if (chatData.users.includes(demand.requesterId)) {
          existingChatRoom = { id: doc.id, ...chatData };
        }
      });
      
      if (existingChatRoom) {
        // Navigate to existing chat
        navigate(`/chat/${existingChatRoom.id}`);
      } else {
        // Create new chat room
        const newChatRoomRef = await addDoc(collection(db, 'chatRooms'), {
          users: [user.email, demand.requesterId],
          messages: [],
          createdAt: serverTimestamp(),
          lastMessage: '',
          lastMessageTimestamp: serverTimestamp(),
          lastActivity: serverTimestamp()
        });
        
        // Navigate to new chat
        navigate(`/chat/${newChatRoomRef.id}`);
      }
    } catch (error) {
      console.error('Error creating/accessing chat:', error);
      // Fallback to WhatsApp if chat creation fails
      const message = `Hi! I saw your demand for "${demand.title}" on HiiHive marketplace. I might have what you're looking for!`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  }, [user, navigate]);

  // View item details
  const handleViewItemDetails = useCallback((item) => {
    setShowItemDetails(item);
  }, []);

  // Close item details
  const handleCloseItemDetails = useCallback(() => {
    setShowItemDetails(null);
  }, []);

  // Open add item modal
  const handleOpenAddModal = useCallback(() => {
    setShowAddModal(true);
  }, []);

  // Close add item modal
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
  }, []);

  // Open add demand modal
  const handleOpenDemandModal = useCallback(() => {
    setShowDemandModal(true);
  }, []);

  // Close add demand modal
  const handleCloseDemandModal = useCallback(() => {
    setShowDemandModal(false);
  }, []);

  // Set active tab
  const handleSetActiveTab = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  // Handle search query change
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  // Handle category change
  const handleCategoryChange = useCallback((e) => {
    setSelectedCategory(e.target.value);
  }, []);

  // Handle condition change
  const handleConditionChange = useCallback((e) => {
    setSelectedCondition(e.target.value);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Please Login</h2>
          <p className="text-gray-400">You need to be logged in to access the marketplace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Header */}
      <div className="bg-black border-b border-gray-800 sticky top-0 z-40">
        <div className="px-4 py-4">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="text-blue-400" size={28} />
              <div>
                <h1 className="text-xl font-bold text-white">Marketplace</h1>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <MapPin size={12} />
                  {user?.college}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-3 hover:bg-gray-800 rounded-full transition-colors active:scale-95"
            >
              <Filter className="text-white" size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search items or demands..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-4 py-4 bg-gray-900 border border-gray-700 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
            />
          </div>

          {/* Filters (Collapsible) */}
          {showFilters && (
            <div className="space-y-3 mb-4">
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              
              {activeTab === 'marketplace' && (
                <select
                  value={selectedCondition}
                  onChange={handleConditionChange}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  {conditions.map(condition => (
                    <option key={condition.id} value={condition.id}>
                      {condition.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex bg-gray-900 rounded-2xl p-1">
            <button
              onClick={() => handleSetActiveTab('marketplace')}
              className={`flex-1 py-3 px-4 rounded-2xl font-medium text-sm transition-all active:scale-95 ${
                activeTab === 'marketplace'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400'
              }`}
            >
              🛍️ Items ({filteredItems.length})
            </button>
            <button
              onClick={() => handleSetActiveTab('demands')}
              className={`flex-1 py-3 px-4 rounded-2xl font-medium text-sm transition-all active:scale-95 ${
                activeTab === 'demands'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-400'
              }`}
            >
              📦 Demands ({filteredDemands.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-32">
        {activeTab === 'marketplace' && (
          <div>
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                  <ItemCard 
                    key={item.id} 
                    item={item} 
                    onViewDetails={handleViewItemDetails}
                    onContact={handleContactSeller}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No items found</h3>
                <p className="text-gray-400 mb-4">
                  {searchQuery || selectedCategory !== 'all' || selectedCondition !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Be the first to list an item for sale!'
                  }
                </p>
                <button
                  onClick={handleOpenAddModal}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-medium hover:bg-blue-700 transition-colors active:scale-95"
                >
                  Post Your First Item
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'demands' && (
          <div>
            {filteredDemands.length > 0 ? (
              <div className="space-y-4">
                {filteredDemands.map(demand => (
                  <DemandCard 
                    key={demand.id} 
                    demand={demand} 
                    onRespond={handleRespondToDemand}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No demands found</h3>
                <p className="text-gray-400 mb-4">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Be the first to create a demand!'
                  }
                </p>
                <button
                  onClick={handleOpenDemandModal}
                  className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-medium hover:bg-orange-700 transition-colors active:scale-95"
                >
                  Create Your First Demand
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-3 z-50">
        <button
          onClick={handleOpenDemandModal}
          className="bg-orange-600 text-white p-4 rounded-full shadow-lg hover:bg-orange-700 transition-colors active:scale-95"
        >
          <Plus size={24} />
        </button>
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors active:scale-95"
        >
          <ShoppingBag size={24} />
        </button>
      </div>

      {/* Modals */}
      <Modal isOpen={showAddModal} onClose={handleCloseAddModal}>
        <AddItemFormContent
          onClose={handleCloseAddModal}
          onSubmit={handleAddItem}
          form={itemForm}
          onChange={handleItemFormChange}
          loading={loading}
        />
      </Modal>

      <Modal isOpen={showDemandModal} onClose={handleCloseDemandModal}>
        <AddDemandFormContent
          onClose={handleCloseDemandModal}
          onSubmit={handleAddDemand}
          form={demandForm}
          onChange={handleDemandFormChange}
          loading={loading}
        />
      </Modal>

      <Modal isOpen={!!showItemDetails} onClose={handleCloseItemDetails}>
        {showItemDetails && (
          <ItemDetailsContent
            item={showItemDetails}
            onClose={handleCloseItemDetails}
            onContact={handleContactSeller}
          />
        )}
      </Modal>
    </div>
  );
};

export default MarketPlace;