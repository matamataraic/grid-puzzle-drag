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
  DialogFooter,
} from "@/components/ui/dialog";

interface TilePosition {
  id: string;
  x: number;
  y: number;
  rotation: number;
  imageIndex: number;
}

interface OrderFormData {
  name: string;
  address: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
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
  const [showOrder, setShowOrder] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderFormData>({
    name: '',
    address: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
  });

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
    
    const cols = Math.floor(window.innerWidth / 51);
    const rows = Math.floor(window.innerHeight / 51);

    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);

    let index = 0;

    for (let y = -centerY; y < centerY; y++) {
      for (let x = -centerX; x < centerX; x++) {
        if ((x + y) % 1 === 0) {
          newTiles.push({
            id: `tile-${index}`,
            x: window.innerWidth / 2 + x * 51,
            y: window.innerHeight / 2 + y * 51,
            rotation: Math.floor(Math.random() * 4) * 90,
            imageIndex: Math.floor(Math.random() * loadedImages.length),
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

    if (isGridGenerated && gridTiles.length > 0) {
      const oldRows = gridTiles.length;
      const oldCols = gridTiles[0].length;
      
      const newGrid = Array(v).fill(null).map((_, rowIndex) => 
        Array(h).fill(null).map((_, colIndex) => {
          if (rowIndex < oldRows && colIndex < oldCols) {
            return gridTiles[rowIndex][colIndex];
          }
          return null;
        })
      );
      
      setGridTiles(newGrid);
    } else {
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
        setTiles(prev => [...prev]);
      }
    } else {
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

  const handleSubmitOrder = () => {
    const subject = `Order ${new Date().toLocaleString()}`;
    const totalS0 = imageCounts.S0 * 5;
    const totalS1 = imageCounts.S1 * 10;
    const totalS2 = imageCounts.S2 * 10;
    const grandTotal = totalS0 + totalS1 + totalS2;
    
    const body = `
    Ime i prezime: ${orderForm.name}
    Ulica stanovanja: ${orderForm.address}
    Poštanski broj i grad: ${orderForm.postalCode}
    Država: ${orderForm.country}
    Telefon: ${orderForm.phone}
    E-mail: ${orderForm.email}

    Narudžba:
    S0: ${imageCounts.S0} x 5€ = ${totalS0}€
    S1: ${imageCounts.S1} x 10€ = ${totalS1}€
    S2: ${imageCounts.S2} x 10€ = ${totalS2}€

    Dimenzije: ${horizontal && vertical ? `${parseInt(horizontal) * 15} x ${parseInt(vertical) * 15} cm` : ''}
    Ukupno: ${grandTotal.toFixed(2)}€
    `;

    const mailtoLink = `mailto:matamataraic@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleOrderClick = () => {
    const hasEmptyCells = gridTiles.some(row => row.some(cell => cell === null));
    if (hasEmptyCells) {
      setShowWarning(true);
    } else {
      setShowOrder(true);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 fixed w-full">
      <div className="fixed top-0 left-0 right-0 h-[125px] bg-neutral-50 z-[5]" />
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
            onClick={() => setShowInfo(true)}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            <Info className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            start
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            clear
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRestart}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            <RotateCcw className="w-4 h-4" />
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
              animate={{ opacity: 0.15, scale: 1 }}
              transition={{ duration: 0 }}
            />
          ))}
        </AnimatePresence>

        <div className="fixed bottom-[5px] left-0 right-0 flex flex-col items-center gap-1 pb-10 z-20">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOrderClick}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            order
          </motion.button>

          <div className="flex items-start gap-10 mt-2.5">
            <div className="flex flex-col items-center">
              <div className="flex gap-2">
                <span className="text-sm font-medium">S0:</span>
                <span className="text-sm">{imageCounts.S0}</span>
                <span className="text-sm">x 5€</span>
              </div>
              <span className="text-sm">{(imageCounts.S0 * 5)}€</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex gap-2">
                <span className="text-sm font-medium">S1:</span>
                <span className="text-sm">{imageCounts.S1}</span>
                <span className="text-sm">x 10€</span>
              </div>
              <span className="text-sm">{(imageCounts.S1 * 10)}€</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex gap-2">
                <span className="text-sm font-medium">S2:</span>
                <span className="text-sm">{imageCounts.S2}</span>
                <span className="text-sm">x 10€</span>
              </div>
              <span className="text-sm">{(imageCounts.S2 * 10)}€</span>
            </div>
          </div>

          <div className="text-sm mt-2.5 flex items-center gap-4">
            <span>
              {horizontal && vertical && `${parseInt(horizontal) * 15} x ${parseInt(vertical) * 15} cm`}
            </span>
            <span className="font-bold">
              {((imageCounts.S0 * 5) + (imageCounts.S1 * 10) + (imageCounts.S2 * 10)).toFixed(2)}€
            </span>
          </div>
        </div>

        <Dialog open={showInfo} onOpenChange={setShowInfo}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>kako</DialogTitle>
              <DialogDescription className="text-left space-y-2">
                <p>• zadaj broj polja u širinu (š) i visinu (v) (jedno polje 15x15cm)</p>
                <p>• crno polje = prazno polje</p>
                <p>• stvori svoju kompoziciju povlačenjem odabrane pločice na odabrano polje ili dvostrukim klikom na pločicu popuni prvo prazno polje</p>
                <p>• promijeni orijentaciju pločice jednim klikom</p>
                <p>• ukloni pločicu dvostrukim klikom</p>
                <p>• "clear" zadrži raspored polja, pobriši pločice</p>
                <p>• "restart" kreni od nule</p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Dialog open={showWarning} onOpenChange={setShowWarning}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>upozorenje</DialogTitle>
              <DialogDescription className="text-left space-y-2">
                <p>neka polja nisu popunjena</p>
                <p>(crno polje - prazno polje)</p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowWarning(false)}
                className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
              >
                nazad
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowWarning(false);
                  setShowOrder(true);
                }}
                className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
              >
                ok
              </motion.button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showOrder} onOpenChange={setShowOrder}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>naruči</DialogTitle>
              <DialogDescription className="text-left space-y-4">
                <p>ispunjavanjem ove forme generira se mail za narudžbu. nakon zaprimanja, na mail ćemo Vam poslati račun. obavijestit ćemo Vas o vidljivoj uplati nakon čega je rok isporuke dva tjedna. poštarina za Hrvatsku uključena u cijenu.</p>
                
                <div className="space-y-2">
                  <p>S0: {imageCounts.S0} x 5€ = {imageCounts.S0 * 5}€</p>
                  <p>S1: {imageCounts.S1} x 10€ = {imageCounts.S1 * 10}€</p>
                  <p>S2: {imageCounts.S2} x 10€ = {imageCounts.S2 * 10}€</p>
                  <p>Dimenzije: {horizontal && vertical ? `${parseInt(horizontal) * 15} x ${parseInt(vertical) * 15} cm` : ''}</p>
                  <p className="font-bold">Ukupno: {((imageCounts.S0 * 5) + (imageCounts.S1 * 10) + (imageCounts.S2 * 10)).toFixed(2)}€</p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Ime i prezime"
                    value={orderForm.name}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Ulica stanovanja"
                    value={orderForm.address}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Poštanski broj i grad"
                    value={orderForm.postalCode}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Država"
                    value={orderForm.country}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon"
                    value={orderForm.phone}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={orderForm.email}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                    <p>napomena: ispuniti sva polja</p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitOrder}
                  className="w-full px-6 py-2 bg-neutral-900 text-white rounded-md font-medium mt-4"
                >
                  pošalji
                </motion.button>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
