'use client';

import { Restaurant } from '@/types';
import { useState, useCallback, useEffect } from 'react';
import { X, Sparkles, Loader2, ChevronLeft, ChevronRight, ImageIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SerpPhoto {
    url: string;
    thumbnail: string;
}

export function PhotosTab({ restaurant }: { restaurant: Restaurant }) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isIdentifying, setIsIdentifying] = useState(false);
    const [identifiedDish, setIdentifiedDish] = useState<any>(null);
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

    // SerpAPI Google Maps Photos
    const [extraPhotos, setExtraPhotos] = useState<SerpPhoto[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [cachedDataId, setCachedDataId] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [serpError, setSerpError] = useState<string | null>(null);

    const googlePhotos = restaurant.photoReferences || [];

    // Combine Google Places photos + SerpAPI photos
    const allPhotos: string[] = [
        ...googlePhotos,
        ...extraPhotos.map((img) => img.url),
    ];

    const openModal = (index: number) => setSelectedIndex(index);
    const closeModal = () => {
        setSelectedIndex(null);
        setIdentifiedDish(null);
    };

    const goNext = useCallback(() => {
        if (selectedIndex !== null) {
            setSelectedIndex((selectedIndex + 1) % allPhotos.length);
            setIdentifiedDish(null);
        }
    }, [selectedIndex, allPhotos.length]);

    const goPrev = useCallback(() => {
        if (selectedIndex !== null) {
            setSelectedIndex((selectedIndex - 1 + allPhotos.length) % allPhotos.length);
            setIdentifiedDish(null);
        }
    }, [selectedIndex, allPhotos.length]);

    // Load more photos from SerpAPI Google Maps Photos
    const loadMorePhotos = async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        setSerpError(null);

        try {
            const params = new URLSearchParams();
            params.set('name', restaurant.name);
            if (restaurant.address) params.set('address', restaurant.address);
            if (restaurant.lat) params.set('lat', String(restaurant.lat));
            if (restaurant.lng) params.set('lng', String(restaurant.lng));
            if (cachedDataId) params.set('data_id', cachedDataId);
            if (nextPageToken) params.set('next_page_token', nextPageToken);

            const res = await fetch(`/api/photos?${params}`);
            const data = await res.json();

            if (data.error && !data.images) {
                setSerpError(data.error);
                setHasMore(false);
                return;
            }

            if (data.images && data.images.length > 0) {
                setExtraPhotos((prev) => [...prev, ...data.images]);
                setNextPageToken(data.nextPageToken || null);
                if (data.dataId) setCachedDataId(data.dataId);
                setHasMore(data.hasMore);
            } else {
                setHasMore(false);
            }
        } catch {
            setSerpError('Failed to load more photos');
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const identifyDish = async () => {
        if (selectedIndex === null) return;
        setIsIdentifying(true);
        setIdentifiedDish(null);

        try {
            const photoUrl = allPhotos[selectedIndex];
            const imgRes = await fetch(photoUrl);
            const blob = await imgRes.blob();
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });

            const res = await fetch('/api/identify-dish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64 }),
            });
            const data = await res.json();
            if (data.error) {
                setIdentifiedDish({ dishName: 'Could not identify', description: data.error });
            } else {
                setIdentifiedDish(data);
            }
        } catch {
            setIdentifiedDish({ dishName: 'Error', description: 'Failed to identify dish.' });
        } finally {
            setIsIdentifying(false);
        }
    };

    const handleImageLoad = (index: number) => {
        setLoadedImages(prev => new Set(prev).add(index));
    };

    // Check if a photo index is from Google Places or SerpAPI
    const isGooglePhoto = (index: number) => index < googlePhotos.length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black tracking-tight">Photos</h3>
                <span className="text-sm text-foreground/40 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    {allPhotos.length} photos
                </span>
            </div>

            {allPhotos.length > 0 ? (
                <div className="space-y-4">
                    {/* First photo: full-width hero */}
                    <div
                        onClick={() => openModal(0)}
                        className="relative group overflow-hidden rounded-2xl bg-black/[0.03] border border-black/5 cursor-pointer"
                    >
                        {!loadedImages.has(0) && (
                            <div className="w-full aspect-[16/10] bg-black/[0.03] animate-pulse rounded-2xl" />
                        )}
                        <img
                            src={allPhotos[0]}
                            alt={`${restaurant.name} photo 1`}
                            className={`w-full aspect-[16/10] object-cover transition-opacity duration-300 ${loadedImages.has(0) ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
                            loading="eager"
                            onLoad={() => handleImageLoad(0)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-xs font-bold text-white uppercase tracking-wider bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg">
                                View Full Size
                            </span>
                        </div>
                    </div>

                    {/* Remaining photos: 2-column masonry */}
                    {allPhotos.length > 1 && (
                        <div className="columns-2 gap-3 space-y-3">
                            {allPhotos.slice(1).map((photoUrl: string, i: number) => {
                                const actualIndex = i + 1;
                                return (
                                    <div
                                        key={`photo-${actualIndex}`}
                                        onClick={() => openModal(actualIndex)}
                                        className="relative group overflow-hidden rounded-2xl bg-black/[0.03] border border-black/5 cursor-pointer break-inside-avoid"
                                    >
                                        {!loadedImages.has(actualIndex) && (
                                            <div className={`w-full ${actualIndex % 3 === 0 ? 'aspect-[3/4]' : actualIndex % 3 === 1 ? 'aspect-square' : 'aspect-[4/3]'} bg-black/[0.03] animate-pulse`} />
                                        )}
                                        <img
                                            src={photoUrl}
                                            alt={`${restaurant.name} photo ${actualIndex + 1}`}
                                            className={`w-full object-cover transition-opacity duration-300 ${actualIndex % 3 === 0 ? 'aspect-[3/4]' : actualIndex % 3 === 1 ? 'aspect-square' : 'aspect-[4/3]'} ${loadedImages.has(actualIndex) ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
                                            loading="lazy"
                                            onLoad={() => handleImageLoad(actualIndex)}
                                            onError={(e) => {
                                                // Hide broken SerpAPI images
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg">
                                                View
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Source info */}
                    <p className="text-center text-foreground/30 text-xs pt-2">
                        {googlePhotos.length} from Google Places
                        {extraPhotos.length > 0 && ` · ${extraPhotos.length} from web`}
                    </p>

                    {/* Load more button */}
                    {hasMore && (
                        <div className="flex justify-center pt-2 pb-4">
                            <button
                                onClick={loadMorePhotos}
                                disabled={isLoadingMore}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent/10 hover:bg-accent/20 text-accent font-bold text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 border border-accent/20"
                            >
                                {isLoadingMore ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                {isLoadingMore ? 'Loading...' : 'Load More Photos'}
                            </button>
                        </div>
                    )}

                    {/* Error message */}
                    {serpError && (
                        <p className="text-center text-red-400 text-xs py-2">{serpError}</p>
                    )}
                </div>
            ) : (
                <p className="text-center text-foreground/40 py-10">No photos available for this restaurant.</p>
            )}

            {/* Photo Modal */}
            <AnimatePresence>
                {selectedIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-4xl w-full mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={closeModal}
                                className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Navigation */}
                            {allPhotos.length > 1 && (
                                <>
                                    <button
                                        onClick={goPrev}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors z-10"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={goNext}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors z-10"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </>
                            )}

                            {/* Image */}
                            <img
                                src={allPhotos[selectedIndex]}
                                alt={`${restaurant.name} photo ${selectedIndex + 1}`}
                                className="w-full max-h-[75vh] object-contain rounded-2xl"
                            />

                            {/* Bottom bar */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-white/60 text-sm">
                                        {selectedIndex + 1} / {allPhotos.length}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/10 text-white/40">
                                        {isGooglePhoto(selectedIndex) ? 'Google' : 'Web'}
                                    </span>
                                </div>

                                <button
                                    onClick={identifyDish}
                                    disabled={isIdentifying}
                                    className="inline-flex items-center px-4 py-2 rounded-xl bg-accent text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-accent/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isIdentifying ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4 mr-2" />
                                    )}
                                    {isIdentifying ? 'Analyzing...' : 'Identify Dish'}
                                </button>
                            </div>

                            {/* Identified dish result */}
                            <AnimatePresence>
                                {identifiedDish && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mt-3 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex gap-4"
                                    >
                                        <div className="bg-accent p-2 rounded-xl h-fit">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-0.5">AI Identification</p>
                                            <h4 className="text-white font-bold text-lg">{identifiedDish.dishName}</h4>
                                            <p className="text-sm text-white/60 leading-relaxed mt-1">{identifiedDish.description}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
