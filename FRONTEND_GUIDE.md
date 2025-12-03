# Frontend Implementation Guide

## Current Status

### ✅ Completed
- React app initialized with Create React App
- Dependencies installed (socket.io-client, react-router-dom, axios, react-dnd)
- Folder structure created
- Core services implemented:
  - `services/api.js` - API service with axios
  - `services/socket.js` - Socket.io client service
- Authentication context created (`contexts/AuthContext.js`)
- Auth components created:
  - Login
  - Register
  - ForgotPassword
  - ResetPassword

### 🔨 To Complete

You have two options to complete the frontend:

## Option 1: Simplified MVP (Recommended to Start)

Create a minimal working version first, then iterate. Here's what you need:

### 1. Update App.js
Replace the default App.js content with routing for auth and main app.

### 2. Create Dashboard Component
A simple homepage that lists pages and allows creation.

### 3. Create Basic Canvas Component
A simple canvas that:
- Displays cards from the API
- Allows adding new cards (just text for now)
- Basic positioning without drag-drop initially

### 4. Add Styling
Create basic CSS files for a functional UI.

## Option 2: Full Implementation

For the complete application with all features, you need to create:

### Layout Components
- `components/layout/Dashboard.js` - Main homepage
- `components/layout/Sidebar.js` - Collapsible navigation
- `components/layout/Header.js` - Top bar with user menu

### Canvas Components
- `components/canvas/CanvasBoard.js` - Main canvas container
- `components/canvas/ZoomPan.js` - Zoom and pan functionality
- `components/canvas/Grid.js` - Background grid

### Card Components
- `components/card/Card.js` - Individual card component
- `components/card/CardModal.js` - Edit card details
- `components/card/CardLink.js` - Visual link between cards

### Page Components
- `components/page/PageList.js` - List of pages
- `components/page/PageCreate.js` - Create new page
- `components/page/PageSettings.js` - Edit page settings

### Collaboration Components
- `components/collab/InviteUser.js` - Invite modal
- `components/collab/PendingInvites.js` - Invitations list
- `components/collab/UserSearch.js` - Search users

### Hooks (Custom React Hooks)
```javascript
// hooks/useSocket.js
import { useEffect } from 'react';
import socketService from '../services/socket';

export const useSocket = (pageId, handlers) => {
    useEffect(() => {
        if (!pageId) return;

        socketService.joinPage(pageId);

        // Register handlers
        Object.entries(handlers).forEach(([event, handler]) => {
            socketService.on(event, handler);
        });

        return () => {
            socketService.leavePage(pageId);
            Object.keys(handlers).forEach(event => {
                socketService.off(event);
            });
        };
    }, [pageId, handlers]);
};

// hooks/usePages.js
import { useState, useEffect } from 'react';
import { pagesAPI } from '../services/api';

export const usePages = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPages = async () => {
        try {
            const response = await pagesAPI.getPages();
            setPages(response.data.pages);
        } catch (error) {
            console.error('Failed to fetch pages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    return { pages, loading, refetch: fetchPages };
};
```

### Styles Needed
```
styles/
├── Auth.css          - Login, Register forms
├── Dashboard.css     - Homepage layout
├── Canvas.css        - Canvas and board styles
├── Card.css          - Card styling
├── Sidebar.css       - Navigation sidebar
├── Modal.css         - Modals and dialogs
└── global.css        - Global styles
```

## Quick Start Development

### 1. Create .env file in client/
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

### 2. Start both servers
```bash
# Terminal 1 - Backend
npm run server:dev

# Terminal 2 - Frontend
cd client && npm start
```

### 3. Test Flow
1. Register a new user at http://localhost:3000/register
2. Login
3. Create a page
4. Add cards to the page

## Implementation Priority

If building incrementally, follow this order:

1. **Auth Flow** ✅ (DONE)
   - Login, Register work

2. **Dashboard** (NEXT)
   - Show list of pages
   - Create new page button

3. **Basic Canvas**
   - Display page
   - Show cards as simple divs
   - Add card button

4. **Card Editing**
   - Click to edit card
   - Update text, colors

5. **Drag & Drop**
   - Use react-dnd to make cards draggable
   - Update position via API

6. **Real-Time**
   - Connect socket
   - Show live updates from other users

7. **Polish**
   - Zoom/pan
   - Card links
   - Collaboration features

## Key Integration Points

### Socket.io Client Usage
```javascript
import socketService from '../services/socket';
import { useAuth } from '../contexts/AuthContext';

// In your component
const { token } = useAuth();

useEffect(() => {
    socketService.connect(token);

    socketService.on('card-updated', (data) => {
        // Update card in state
    });

    return () => {
        socketService.disconnect();
    };
}, [token]);
```

### API Usage
```javascript
import { pagesAPI, cardsAPI } from '../services/api';

// Create page
const handleCreatePage = async () => {
    const response = await pagesAPI.createPage({
        name: 'My Page',
        background_color: '#FFFFFF'
    });
    console.log('Created:', response.data);
};

// Get cards
const fetchCards = async (pageId) => {
    const response = await cardsAPI.getCards(pageId);
    setCards(response.data.cards);
};
```

## React DnD Integration Example

```javascript
import { useDrag } from 'react-dnd';

const Card = ({ card, onMove }) => {
    const [{ isDragging }, drag] = useDrag({
        type: 'CARD',
        item: { id: card.id, x: card.x_position, y: card.y_position },
        end: (item, monitor) => {
            const dropResult = monitor.getDropResult();
            if (dropResult) {
                onMove(item.id, dropResult.x, dropResult.y);
            }
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        })
    });

    return (
        <div
            ref={drag}
            style={{
                position: 'absolute',
                left: card.x_position,
                top: card.y_position,
                opacity: isDragging ? 0.5 : 1
            }}
        >
            {card.content}
        </div>
    );
};
```

## Next Steps

Choose your approach:
1. **Quick MVP**: Focus on basic functionality first
2. **Full Build**: Implement all features from the plan

Either way, the backend is complete and ready to support any frontend you build!

## Testing

### Manual Testing Checklist
- [ ] Register new user
- [ ] Login
- [ ] Create page
- [ ] Add card to page
- [ ] Move card
- [ ] Edit card
- [ ] Delete card
- [ ] Create card link
- [ ] Invite user to page
- [ ] Test real-time updates (open two browsers)

## Resources

- React Router: https://reactrouter.com/
- React DnD: https://react-dnd.github.io/react-dnd/
- Socket.io Client: https://socket.io/docs/v4/client-api/
- Axios: https://axios-http.com/docs/intro

