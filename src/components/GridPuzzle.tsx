
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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

  // Load and resize images
  useEffect(() => {
    const loadImages = async () => {
      const imageNames = ['S0', 'S1', 'S2'];
      const loadedImages = await Promise.all(
        imageNames.map(async (name) => {
          const response = await fetch(`/${name}.png`);
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        })
      );
      setImages(loadedImages);
      generateRandomTiles(loadedImages);
    };
    loadImages();
  }, []);

  const generateRandomTiles = (loadedImages: string[]) => {
    const newTiles: TilePosition[] = [];
    for (let i = 0; i < 15; i++) {
      newTiles.push({
        id: `tile-${i}`,
        x: Math.random() * (window.innerWidth - 100),
        y: Math.random() * (window.innerHeight - 100),
        rotation: Math.floor(Math.random() * 4) * 90,
        imageIndex: Math.floor(Math.random() * loadedImages.length),
      });
    }
    setTiles(newTiles);
  };

  const handleStart = () => {
    const h = parseInt(horizontal);
    const v = parseInt(vertical);
    if (isNaN(h) || isNaN(v) || h <= 0 || v <= 0) return;

    const newGrid = Array(v).fill(null).map(() => Array(h).fill(null));
    setGridTiles(newGrid);
    setIsGridGenerated(true);
  };

  const handleDragEnd = (
    event: any,
    info: any,
    tileId: string,
    sourceIndex?: number
  ) => {
    if (!gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const x = event.clientX - gridRect.left;
    const y = event.clientY - gridRect.top;

    const cellX = Math.floor(x / 50);
    const cellY = Math.floor(y / 50);

    if (
      cellX >= 0 &&
      cellX < parseInt(horizontal) &&
      cellY >= 0 &&
      cellY < parseInt(vertical)
    ) {
      const updatedGrid = [...gridTiles];
      const tile = tiles.find((t) => t.id === tileId);
      if (tile) {
        if (updatedGrid[cellY][cellX] === null) {
          updatedGrid[cellY][cellX] = { ...tile };
          setGridTiles(updatedGrid);
        }
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
    }
  };

  const handleGridDoubleClick = (y: number, x: number) => {
    const updatedGrid = [...gridTiles];
    updatedGrid[y][x] = null;
    setGridTiles(updatedGrid);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center pt-5">
      <div className="flex items-center gap-4 mb-5">
        <label className="text-sm font-medium">H</label>
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

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleStart}
        className="px-6 py-2 mb-5 bg-neutral-900 text-white rounded-md font-medium"
      >
        Start
      </motion.button>

      {isGridGenerated && (
        <div
          ref={gridRef}
          className="relative border border-black"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${horizontal}, 50px)`,
            gridTemplateRows: `repeat(${vertical}, 50px)`,
          }}
        >
          {gridTiles.map((row, y) =>
            row.map((tile, x) => (
              <div
                key={`${y}-${x}`}
                className="border border-black w-[50px] h-[50px]"
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
        {tiles.map((tile, index) => (
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
            }}
            drag
            dragSnapToOrigin
            onDragEnd={(event, info) => handleDragEnd(event, info, tile.id)}
            onDoubleClick={() => handleDoubleClick(tile.id)}
            whileHover={{ scale: 1.1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
