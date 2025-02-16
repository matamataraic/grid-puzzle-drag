import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Info, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TilePosition {
  id: string;
  x: number;
  y: number;
  rotation: number;
  imageIndex: number;
}

export const GridPuzzle = () => {
  const [horizontal, setHorizontal] = useState('');
  const [vertical, setVertical] = useState('');
  const [isGridGenerated, setIsGridGenerated] = useState(false);
  const [tiles, setTiles] = useState<TilePosition[]>([]);
  const [gridTiles, setGridTiles] = useState<(TilePosition | null)[][]>([]);
  const [images, setImages] = useState<string[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const [imageCounts, setImageCounts] = useState({ S0: 0, S1: 0, S2: 0 });
  const [showInfo, setShowInfo] = useState(false);

  // Handle infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
        const newTiles: TilePosition[] = [];
        for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
          for (let i = 0; i < 10; i++) {
            newTiles.push({
              id: `tile-${Date.now()}-${imageIndex}-${i}`,
              x: Math.random() * (window.innerWidth - 100),
              y: Math.random() * (document.documentElement.scrollHeight + 500),
              rotation: Math.floor(Math.random() * 4) * 90,
              imageIndex,
            });
          }
        }
        setTiles(prev => [...prev, ...newTiles]);
        document.documentElement.style.minHeight = `${document.documentElement.scrollHeight + 500}px`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [images]);

  // Update image counts whenever gridTiles changes
  useEffect(() => {
    const counts = { S0: 0, S1: 0, S2: 0 };
    gridTiles.forEach(row => {
      row.forEach(tile => {
        if (tile) {
          counts[`S${tile.imageIndex}` as keyof typeof counts]++;
        }
      });
    });
    setImageCounts(counts);
  }, [gridTiles]);

  // Load and resize images
  useEffect(() => {
    const loadImages = async () => {
      const imageUrls = [
        'https://i.imgur.com/RSSS8zt.png',
        'https://i.imgur.com/6xIAB8j.png',
        'https://i.imgur.com/eRSAL3Z.png'
      ];
      setImages(imageUrls);
      generateRandomTiles(imageUrls);
    };
    loadImages();
  }, []);

  const generateRandomTiles = (loadedImages: string[]) => {
    const newTiles: TilePosition[] = [];
    
    const cols = Math.floor(window.innerWidth / 51); // Columns based on screen width (50px + 1px gap)
    const rows = Math.floor(window.innerHeight / 51); // Rows based on screen height

    const centerX = Math.floor(cols / 2); // Center column index
    const centerY = Math.floor(rows / 2); // Center row index

    let index = 0;

    for (let y = -centerY; y < centerY; y++) {
      for (let x = -centerX; x < centerX; x++) {
        if ((x + y) % 2 === 0) { // Only place a tile in every second field
          newTiles.push({
            id: `tile-${index}`,
            x: window.innerWidth / 2 + x * 51, // Centering X
            y: window.innerHeight / 2 + y * 51, // Centering Y
            rotation: Math.floor(Math.random() * 4) * 90,
            imageIndex: Math.floor(Math.random() * loadedImages.length), // Random image
          });
          index++;
        }
      }
    }

    setTiles(newTiles);
  };

  const handleStart = () => {
    const h = parseInt(horizontal);
    const v = parseInt(vertical);
    if (isNaN(h) || isNaN(v) || h <= 0 || v <= 0) return;

    // If there's an existing grid, adapt it to the new dimensions
    if (isGridGenerated && gridTiles.length > 0) {
      const oldRows = gridTiles.length;
      const oldCols = gridTiles[0].length;
      
      // Create new grid with new dimensions while preserving existing tiles
      const newGrid = Array(v).fill(null).map((_, rowIndex) => 
        Array(h).fill(null).map((_, colIndex) => {
          // If within bounds of old grid, keep the existing tile
          if (rowIndex < oldRows && colIndex < oldCols) {
            return gridTiles[rowIndex][colIndex];
          }
          return null;
        })
      );
      
      setGridTiles(newGrid);
    } else {
      // If no existing grid, create a new empty one
      const newGrid = Array(v).fill(null).map(() => Array(h).fill(null));
      setGridTiles(newGrid);
    }
    
    setIsGridGenerated(true);
  };

  const handleRestart = () => {
    setHorizontal('');
    setVertical('');
    setIsGridGenerated(false);
    setGridTiles([]);
    setImageCounts({ S0: 0, S1: 0, S2: 0 });
  };

  const handleDragEnd = (
    event: any,
    info: any,
    tileId: string,
  ) => {
    if (!gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const x = event.clientX - gridRect.left;
    const y = event.clientY - gridRect.top;

    const cellX = Math.floor(x / 50);
    const cellY = Math.floor(y / 50);

    // Remove the dragged tile from tiles array
    const updatedTiles = tiles.filter(t => t.id !== tileId);
    const draggedTile = tiles.find(t => t.id === tileId);

    if (
      draggedTile &&
      cellX >= 0 &&
      cellX < parseInt(horizontal) &&
      cellY >= 0 &&
      cellY < parseInt(vertical)
    ) {
      const updatedGrid = [...gridTiles];
      if (updatedGrid[cellY][cellX] === null) {
        updatedGrid[cellY][cellX] = { ...draggedTile };
        setGridTiles(updatedGrid);
        setTiles(updatedTiles);
        
        // Generate a new tile to replace the dragged one
        setTimeout(() => {
          const newTile: TilePosition = {
            id: `tile-${Date.now()}`,
            x: draggedTile.x,
            y: draggedTile.y,
            rotation: Math.floor(Math.random() * 4) * 90,
            imageIndex: Math.floor(Math.random() * images.length),
          };
          setTiles(prev => [...prev, newTile]);
        }, 100);
      } else {
        // If the cell is occupied, add the tile back to its original position
        setTiles(prev => [...prev]);
      }
    } else {
      // If dropped outside the grid but not in original position
      const dropX = event.clientX;
      const dropY = event.clientY;
      
      if (draggedTile) {
        const updatedTiles = tiles.map(t => 
          t.id === tileId 
            ? { ...t, x: dropX - 25, y: dropY - 25 }
            : t
        );
        setTiles(updatedTiles);
      }
    }
  };

  const handleRotate = (y: number, x: number) => {
    const updatedGrid = [...gridTiles];
    if (updatedGrid[y][x]) {
      updatedGrid[y][x] = {
        ...updatedGrid[y][x]!,
        rotation: (updatedGrid[y][x]!.rotation + 90) % 360,
      };
      setGridTiles(updatedGrid);
    }
  };

  const handleDoubleClick = (tileId: string) => {
    let placed = false;
    const updatedGrid = [...gridTiles];
    const tile = tiles.find((t) => t.id === tileId);

    if (!tile) return;

    for (let y = 0; y < updatedGrid.length && !placed; y++) {
      for (let x = 0; x < updatedGrid[y].length && !placed; x++) {
        if (updatedGrid[y][x] === null) {
          updatedGrid[y][x] = { ...tile };
          placed = true;
        }
      }
    }

    if (placed) {
      setGridTiles(updatedGrid);
      setTiles(prev => prev.filter(t => t.id !== tileId));
      
      // Generate a new tile to replace the placed one
      setTimeout(() => {
        const newTile: TilePosition = {
          id: `tile-${Date.now()}`,
          x: tile.x,
          y: tile.y,
          rotation: Math.floor(Math.random() * 4) * 90,
          imageIndex: Math.floor(Math.random() * images.length),
        };
        setTiles(prev => [...prev, newTile]);
      }, 100);
    }
  };

  const handleGridDoubleClick = (y: number, x: number) => {
    const updatedGrid = [...gridTiles];
    updatedGrid[y][x] = null;
    setGridTiles(updatedGrid);
  };

  const handleClear = () => {
    const newGrid = Array(parseInt(vertical))
      .fill(null)
      .map(() => Array(parseInt(horizontal)).fill(null));
    setGridTiles(newGrid);
  };

  return (
    <div className="min-h-screen bg-neutral-50 fixed w-full">
      {/* Top clear strip */}
      <div className="fixed top-0 left-0 right-0 h-[125px] bg-neutral-50 z-[5]" />

      {/* Bottom clear strip */}
      <div className="fixed bottom-0 left-0 right-0 h-[125px] bg-neutral-50 z-[5]" />

      <div className="flex flex-col items-center pt-[45px] relative">
        <div className="flex items-center gap-4 fixed top-[45px] z-20">
          <label className="text-sm font-medium">Š</label>
          <input
            type="text"
            maxLength={2}
            value={horizontal}
            onChange={(e) => setHorizontal(e.target.value.replace(/\D/g, ''))}
            className="w-16 h-8 text-center border border-neutral-300 rounded-md"
          />
          <span className="text-sm font-medium">×</span>
          <label className="text-sm font-medium">V</label>
          <input
            type="text"
            maxLength={2}
            value={vertical}
            onChange={(e) => setVertical(e.target.value.replace(/\D/g, ''))}
            className="w-16 h-8 text-center border border-neutral-300 rounded-md"
          />
        </div>

        <div className="fixed top-[105px] z-20 flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRestart}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            Start
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowInfo(true)}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            <Info className="w-4 h-4" />
          </motion.button>
        </div>

        {isGridGenerated && (
          <div
            ref={gridRef}
            className="relative border border-BLACK bg-white z-10"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${horizontal}, 50px)`,
              gridTemplateRows: `repeat(${vertical}, 50px)`,
              position: 'fixed',
              top: '165px',
              borderWidth: '1px',
              borderColor: 'white'
            }}
          >
            {gridTiles.map((row, y) =>
              row.map((tile, x) => (
                <div
                  key={`${y}-${x}`}
                  className="border border-white w-[50px] h-[50px]"
                  style={{ backgroundColor: 'BLACK' }}
                  onDoubleClick={() => handleGridDoubleClick(y, x)}
                >
                  {tile && (
                    <motion.img
                      src={images[tile.imageIndex]}
                      className="w-full h-full object-cover cursor-pointer"
                      animate={{ rotate: tile.rotation }}
                      onClick={() => handleRotate(y, x)}
                      transition={{ type: 'spring', stiffness: 200 }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <AnimatePresence>
          {tiles.map((tile) => (
            <motion.img
              key={tile.id}
              src={images[tile.imageIndex]}
              className={cn(
                'absolute w-[50px] h-[50px] cursor-move',
                'hover:shadow-lg transition-shadow'
              )}
              style={{
                left: tile.x,
                top: tile.y,
                rotate: tile.rotation,
                zIndex: 1
              }}
              drag
              onDragEnd={(event, info) => handleDragEnd(event, info, tile.id)}
              onDoubleClick={() => handleDoubleClick(tile.id)}
              whileHover={{ scale: 1.1 }}
              whileDrag={{ zIndex: 15 }}
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0.25, scale: 1 }}
              transition={{ duration: 0 }}
            />
          ))}
        </AnimatePresence>

        <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center gap-4 pb-4 z-20">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            Clear
          </motion.button>
          
          <div className="flex items-center gap-10 mt-2.5">
            <div className="flex gap-2">
              <span className="text-sm font-medium">S0:</span>
              <span className="text-sm">{imageCounts.S0}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-sm font-medium">S1:</span>
              <span className="text-sm">{imageCounts.S1}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-sm font-medium">S2:</span>
              <span className="text-sm">{imageCounts.S2}</span>
            </div>
          </div>

          <div className="text-sm mt-2.5">
            {horizontal && vertical && `${parseInt(horizontal) * 15} x ${parseInt(vertical) * 15} cm`}
          </div>
        </div>

        <Dialog open={showInfo} onOpenChange={setShowInfo}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Information</DialogTitle>
              <DialogDescription>
                bla bla bla bla
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
