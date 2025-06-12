import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';

const db = getFirestore();

// Create or get college community
export const createOrJoinCollegeCommunity = async (userId, userCollege, userDetails) => {
  try {
    if (!userCollege || !userId) {
      console.log('Missing required data for community creation');
      return null;
    }

    // Sanitize college name for use as document ID
    const sanitizedCollegeName = userCollege
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const communityId = `college_${sanitizedCollegeName}`;
    const communityRef = doc(db, 'communities', communityId);

    // Check if community already exists
    const communityDoc = await getDoc(communityRef);

    if (communityDoc.exists()) {
      // Community exists, check if user is already a member
      const existingData = communityDoc.data();
      const isAlreadyMember = existingData.members?.includes(userId);

      if (!isAlreadyMember) {
        // Add user to community
        await updateDoc(communityRef, {
          members: arrayUnion(userId),
          memberCount: (existingData.memberCount || 0) + 1,
          updatedAt: serverTimestamp()
        });

        // Add user to community members subcollection
        const memberRef = doc(db, 'communities', communityId, 'members', userId);
        await setDoc(memberRef, {
          userId,
          joinedAt: serverTimestamp(),
          role: 'member',
          username: userDetails.username || '',
          fullName: userDetails.fullName || '',
          avatar: userDetails.avatar || '',
          email: userDetails.email || ''
        });

        console.log(`User ${userId} joined existing community: ${userCollege}`);
      } else {
        console.log(`User ${userId} is already a member of: ${userCollege}`);
      }
      
      return communityId;
    } else {
      // Create new community
      const newCommunity = {
        id: communityId,
        name: userCollege,
        description: `Official community for ${userCollege} students. Connect with your classmates, share resources, and stay updated with college events.`,
        type: 'college',
        isOfficial: true,
        college: userCollege,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        members: [userId],
        memberCount: 1,
        admins: [userId],
        moderators: [],
        rules: [
          'Be respectful to all community members',
          'No spam or promotional content',
          'Keep discussions relevant to college life',
          'No harassment or bullying',
          'Follow college guidelines and policies'
        ],
        settings: {
          isPrivate: false,
          requireApproval: false,
          allowPostsByMembers: true,
          allowMediaSharing: true
        },
        avatar: null,
        banner: null,
        tags: ['college', 'education', 'students'],
        stats: {
          postsCount: 0,
          eventsCount: 0,
          activeMembers: 1
        },
        unreadCount: 0 // Initialize unread count
      };

      await setDoc(communityRef, newCommunity);

      // Add creator as admin in members subcollection
      const memberRef = doc(db, 'communities', communityId, 'members', userId);
      await setDoc(memberRef, {
        userId,
        joinedAt: serverTimestamp(),
        role: 'admin',
        username: userDetails.username || '',
        fullName: userDetails.fullName || '',
        avatar: userDetails.avatar || '',
        email: userDetails.email || ''
      });

      // Create default channels for the community
      await createDefaultChannels(communityId, userCollege);

      console.log(`Created new community and added user ${userId}: ${userCollege}`);
      return communityId;
    }
  } catch (error) {
    console.error('Error creating/joining college community:', error);
    return null;
  }
};

// Create default channels for new communities
const createDefaultChannels = async (communityId, collegeName) => {
  try {
    const channelsData = [
      {
        id: 'general',
        name: 'general',
        description: 'General discussions for all students',
        type: 'text',
        isDefault: true,
        createdAt: serverTimestamp(),
        messageCount: 0,
        lastActivity: serverTimestamp()
      },
      {
        id: 'announcements',
        name: 'announcements',
        description: 'Official college announcements',
        type: 'text',
        isDefault: true,
        createdAt: serverTimestamp(),
        messageCount: 0,
        lastActivity: serverTimestamp()
      },
      {
        id: 'academics',
        name: 'academics',
        description: 'Academic discussions and study groups',
        type: 'text',
        isDefault: true,
        createdAt: serverTimestamp(),
        messageCount: 0,
        lastActivity: serverTimestamp()
      },
      {
        id: 'events',
        name: 'events',
        description: 'College events and activities',
        type: 'text',
        isDefault: true,
        createdAt: serverTimestamp(),
        messageCount: 0,
        lastActivity: serverTimestamp()
      }
    ];

    const channelsPromises = channelsData.map(channel => {
      const channelRef = doc(db, 'communities', communityId, 'channels', channel.id);
      return setDoc(channelRef, channel);
    });

    await Promise.all(channelsPromises);
    console.log(`Default channels created for ${collegeName}`);
  } catch (error) {
    console.error('Error creating default channels:', error);
  }
};

// Get user's communities with enhanced error handling
export const getUserCommunities = async (userId) => {
  try {
    if (!userId) {
      console.log('No userId provided to getUserCommunities');
      return [];
    }

    console.log(`Fetching communities for user: ${userId}`);
    
    const communitiesRef = collection(db, 'communities');
    const q = query(communitiesRef, where('members', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    
    const communities = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`Found community: ${data.name}`, data);
      
      return {
        id: doc.id,
        ...data,
        // Ensure these fields exist with default values
        memberCount: data.memberCount || 0,
        unreadCount: data.unreadCount || 0,
        isOfficial: data.isOfficial || false,
        type: data.type || 'general'
      };
    });
    
    console.log(`Retrieved ${communities.length} communities for user ${userId}:`, communities);
    return communities;
  } catch (error) {
    console.error('Error fetching user communities:', error);
    return [];
  }
};

// Check if user is already in a college community
export const checkUserCollegeCommunity = async (userId, userCollege) => {
  try {
    if (!userCollege || !userId) return null;

    const sanitizedCollegeName = userCollege
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const communityId = `college_${sanitizedCollegeName}`;
    const communityRef = doc(db, 'communities', communityId);
    const communityDoc = await getDoc(communityRef);

    if (communityDoc.exists()) {
      const data = communityDoc.data();
      return data.members?.includes(userId) ? communityId : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking user college community:', error);
    return null;
  }
};

// Add user to community members list in their profile
export const addCommunityToUserProfile = async (userId, communityId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const existingCommunities = userData.communities || [];
      
      if (!existingCommunities.includes(communityId)) {
        await updateDoc(userRef, {
          communities: arrayUnion(communityId),
          updatedAt: serverTimestamp()
        });
        console.log(`Added community ${communityId} to user ${userId} profile`);
      }
    }
  } catch (error) {
    console.error('Error adding community to user profile:', error);
  }
};

// Debug function to list all communities
export const debugListAllCommunities = async () => {
  try {
    const communitiesRef = collection(db, 'communities');
    const querySnapshot = await getDocs(communitiesRef);
    
    console.log('=== ALL COMMUNITIES IN DATABASE ===');
    querySnapshot.docs.forEach(doc => {
      console.log(`Community ID: ${doc.id}`, doc.data());
    });
    console.log('=== END COMMUNITIES LIST ===');
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error listing communities:', error);
    return [];
  }
};

// Find available college community for user to join manually
export const findAvailableCollegeCommunity = async (userId, userCollege) => {
  try {
    if (!userCollege || !userId) return null;

    const sanitizedCollegeName = userCollege
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const communityId = `college_${sanitizedCollegeName}`;
    const communityRef = doc(db, 'communities', communityId);
    const communityDoc = await getDoc(communityRef);

    if (communityDoc.exists()) {
      const data = communityDoc.data();
      const isAlreadyMember = data.members?.includes(userId);
      
      if (!isAlreadyMember) {
        return {
          id: communityId,
          name: data.name,
          memberCount: data.memberCount || 0,
          description: data.description || `Join your ${userCollege} community`
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding available college community:', error);
    return null;
  }
};

// Manually join college community
export const joinCollegeCommunity = async (userId, userDetails) => {
  try {
    if (!userId || !userDetails?.college) {
      console.log('Missing required data for joining community');
      return null;
    }

    return await createOrJoinCollegeCommunity(userId, userDetails.college, userDetails);
  } catch (error) {
    console.error('Error joining college community:', error);
    return null;
  }
};