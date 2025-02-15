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
  const [imageCounts, setImageCounts] = useState({ S0: 0, S1: 0, S2: 0 });

  const handleStart = () => {
    const h = parseInt(horizontal);
    const v = parseInt(vertical);
    if (isNaN(h) || isNaN(v) || h <= 0 || v <= 0) return;

    const newGrid = Array(v).fill(null).map(() => Array(h).fill(null));
    setGridTiles(newGrid);
    setIsGridGenerated(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50 fixed w-full">
      <div className="fixed top-0 left-0 right-0 h-[125px] bg-neutral-50 z-[5]" />
      <div className="fixed bottom-0 left-0 right-0 h-[160px] bg-neutral-50 z-[5]" />

      <div className="flex flex-col items-center pt-[45px] relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStart}
          className="px-6 py-2 mb-5 bg-neutral-900 text-white rounded-md font-medium fixed top-[105px] z-20"
        >
          Start
        </motion.button>

        {isGridGenerated && (
          <div
            ref={gridRef}
            className="relative border-4 border-white bg-white z-10"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${horizontal}, 50px)`,
              gridTemplateRows: `repeat(${vertical}, 50px)`,
              position: 'fixed',
              top: '165px',
              padding: '10px',
              boxSizing: 'border-box'
            }}
          >
            {gridTiles.map((row, y) =>
              row.map((tile, x) => (
                <div
                  key={`${y}-${x}`}
                  className="border border-white w-[50px] h-[50px] bg-black"
                  onDoubleClick={() => console.log(`Double clicked cell (${y}, ${x})`)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
