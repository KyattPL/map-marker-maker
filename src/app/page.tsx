'use client';
import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Move, ZoomIn, ZoomOut, RotateCcw, MapPin, Check, Copy } from 'lucide-react';
import Image from 'next/image';

interface Marker {
    id: number;
    x: number;
    y: number;
}

const ZOOM_SCALE = 1.5;

const ImageMarkerCreator = () => {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [markers, setMarkers] = useState<Marker[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedMarker, setDraggedMarker] = useState<Marker | null>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isAddingMarker, setIsAddingMarker] = useState(false);
    const [copied, setCopied] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImageUrl(url);
            setMarkers([]);
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
    };

    const getImageCoordinates = (clientX: number, clientY: number): { x: number, y: number } | null => {
        if (!imageRef.current) return null;

        const rect = imageRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        return {
            x: Math.min(Math.max(x, 0), 100),
            y: Math.min(Math.max(y, 0), 100)
        };
    };

    const handleImageClick = (e: React.MouseEvent) => {
        if (isAddingMarker && !isDragging && !isDraggingCanvas) {
            const coords = getImageCoordinates(e.clientX, e.clientY);
            if (coords) {
                setMarkers([...markers, { id: Date.now(), ...coords }]);
                setIsAddingMarker(false);
            }
        }
    };

    const handleMarkerDragStart = (e: React.MouseEvent, marker: Marker) => {
        e.stopPropagation();
        setIsDragging(true);
        setDraggedMarker(marker);
    };

    const handleMarkerDragEnd = () => {
        setIsDragging(false);
        setDraggedMarker(null);
    };

    const handleMarkerDrag = (e: React.MouseEvent) => {
        if (isDragging && draggedMarker) {
            e.stopPropagation();
            const coords = getImageCoordinates(e.clientX, e.clientY);
            if (coords) {
                setMarkers(markers.map(m =>
                    m.id === draggedMarker.id ? { ...m, ...coords } : m
                ));
            }
        }
    };

    const handleCanvasDragStart = (e: React.MouseEvent) => {
        if (!isDragging) {
            setIsDraggingCanvas(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleCanvasDrag = (e: React.MouseEvent) => {
        if (isDraggingCanvas) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleCanvasDragEnd = () => {
        setIsDraggingCanvas(false);
    };

    const removeMarker = (e: React.MouseEvent, markerId: number) => {
        e.stopPropagation();
        setMarkers(markers.filter(m => m.id !== markerId));
    };

    const handleZoom = (zoomIn: boolean) => {
        setScale(prevScale => {
            const newScale = zoomIn ? prevScale * ZOOM_SCALE : prevScale / ZOOM_SCALE;
            return Math.min(Math.max(newScale, 0.5), 10);
        });
    };

    const resetView = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(JSON.stringify(markers, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
            {/* Logo and title section */}
            <div className="flex items-center justify-center gap-3 mb-6">
                <div className="relative w-32 h-32">
                    <Image
                        src="/map-marker-maker/images/logo.png"
                        alt="Map Marker Maker Logo"
                        width={128}
                        height={128}
                        className="rounded-lg"
                    />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Map Marker Maker</h1>
            </div>

            <Card className="p-4">
                <div className="space-y-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />

                    {imageUrl && (
                        <>
                            {/* Controls */}
                            <div className="flex gap-2 mb-2">
                                <Button onClick={() => handleZoom(true)} size="sm">
                                    <ZoomIn className="h-4 w-4 mr-1" /> Zoom In
                                </Button>
                                <Button onClick={() => handleZoom(false)} size="sm">
                                    <ZoomOut className="h-4 w-4 mr-1" /> Zoom Out
                                </Button>
                                <Button onClick={resetView} size="sm" variant="outline">
                                    <RotateCcw className="h-4 w-4 mr-1" /> Reset View
                                </Button>
                                <Button
                                    onClick={() => setIsAddingMarker(true)}
                                    size="sm"
                                    variant={isAddingMarker ? "secondary" : "outline"}
                                    className={isAddingMarker ? "bg-blue-100" : ""}
                                >
                                    <MapPin className="h-4 w-4 mr-1" /> Add Marker
                                </Button>
                            </div>

                            {/* Image container */}
                            <div
                                ref={containerRef}
                                className="relative w-full h-[600px] bg-gray-100 overflow-hidden"
                                style={{
                                    cursor: isAddingMarker ? 'crosshair' : 'move'
                                }}
                                onClick={handleImageClick}
                                onMouseDown={handleCanvasDragStart}
                                onMouseMove={(e) => {
                                    handleMarkerDrag(e);
                                    handleCanvasDrag(e);
                                }}
                                onMouseUp={() => {
                                    handleMarkerDragEnd();
                                    handleCanvasDragEnd();
                                }}
                                onMouseLeave={() => {
                                    handleMarkerDragEnd();
                                    handleCanvasDragEnd();
                                }}
                            >
                                <div
                                    style={{
                                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                        transformOrigin: '0 0',
                                    }}
                                    className="absolute top-0 left-0 h-full flex items-center justify-center"
                                >
                                    <img
                                        ref={imageRef}
                                        src={imageUrl}
                                        alt="Uploaded image"
                                        className="h-full w-auto"
                                        draggable="false"
                                    />

                                    {/* Markers */}
                                    {markers.map((marker) => (
                                        <div
                                            key={marker.id}
                                            className="absolute w-8 h-8"
                                            style={{
                                                left: `${marker.x}%`,
                                                top: `${marker.y}%`,
                                                cursor: isDragging ? 'grabbing' : 'grab',
                                                transform: `translate(-50%, -50%) scale(${1 / scale})`
                                            }}
                                            onMouseDown={(e) => handleMarkerDragStart(e, marker)}
                                        >
                                            <div className="relative group">
                                                <div className="bg-blue-500 text-white rounded-full p-2">
                                                    <Move className="h-4 w-4" />
                                                </div>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute -top-5 -right-5 h-4 w-4 rounded-full opacity-0 group-hover:opacity-100"
                                                    onClick={(e) => removeMarker(e, marker.id)}
                                                >
                                                    <X className="h-2 w-2" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* JSON Output */}
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">Marker Positions (JSON):</h3>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-700 hover:bg-gray-800 text-gray-700 hover:text-white"
                                onClick={copyToClipboard}
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-1" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                        <pre className="bg-gray-800 text-gray-300 p-4 rounded-lg overflow-auto max-h-40">
                            {JSON.stringify(markers, null, 2)}
                        </pre>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ImageMarkerCreator;