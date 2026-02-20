import React from 'react';
import { motion } from 'framer-motion';
import { Product } from '../../lib/wellnessAI';

interface ShoppingCardProps {
    product: Product;
    index: number;
}

export const ShoppingCard: React.FC<ShoppingCardProps> = ({ product, index }) => {
    const getSourceColor = (source: Product['source']) => {
        switch (source) {
            case 'Amazon': return 'text-yellow-500';
            case 'Flipkart': return 'text-blue-500';
            case 'Nykaa': return 'text-pink-500';
            case 'Myntra': return 'text-red-500';
            default: return 'text-gray-400';
        }
    };

    const getSourceIcon = (source: Product['source']) => {
        switch (source) {
            case 'Amazon': return 'shopping_bag';
            case 'Flipkart': return 'local_mall';
            case 'Nykaa': return 'potted_plant';
            case 'Myntra': return 'checkroom';
            default: return 'shopping_cart';
        }
    };

    return (
        <motion.a
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="group block bg-surface-dark/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all shadow-lg"
        >
            <div className="relative aspect-square overflow-hidden bg-white/5">
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10">
                        <span className="material-symbols-outlined text-4xl">image</span>
                    </div>
                )}
                {product.price && (
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[11px] font-black px-2 py-1 rounded-lg border border-white/10">
                        {product.price}
                    </div>
                )}
            </div>

            <div className="p-3">
                <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider">
                    <span className={`material-symbols-outlined text-[14px] ${getSourceColor(product.source)}`}>
                        {getSourceIcon(product.source)}
                    </span>
                    <span className={getSourceColor(product.source)}>{product.source}</span>
                </div>
                <h4 className="text-[13px] font-bold text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {product.title}
                </h4>
            </div>
        </motion.a>
    );
};

export const ShoppingGrid: React.FC<{ products: Product[]; loading: boolean }> = ({ products, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-[4/5] rounded-2xl bg-white/5 animate-pulse" />
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="text-center py-8 opacity-40">
                <span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
                <p className="text-sm">No live products found. Try refreshing.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            {products.map((p, i) => (
                <ShoppingCard key={p.link + i} product={p} index={i} />
            ))}
        </div>
    );
};
