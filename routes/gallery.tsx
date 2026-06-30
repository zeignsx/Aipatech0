import { createFileRoute } from "@tanstack/react-router";
import { MediaGallery } from "@/components/MediaGallery";
import { PageHero } from "@/components/page-hero";
import { useState } from "react";

export const Route = createFileRoute("/gallery")({
  component: Gallery,
});

function Gallery() {
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'projects', label: 'Projects' },
    { value: 'rentals', label: 'Rentals' },
    { value: 'team', label: 'Team' },
    { value: 'gallery', label: 'Gallery' },
    { value: 'hero', label: 'Hero Images' },
  ];

  const types = [
    { value: 'all', label: 'All' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
  ];

  return (
    <>
      <PageHero 
        eyebrow="Media Gallery" 
        title="Explore our visual library" 
        sub="Images and videos from our projects and operations" 
      />
      
      <section className="container-x py-12">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  category === cat.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2 ml-auto">
            {types.map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  type === t.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery */}
        <MediaGallery 
          category={category === 'all' ? undefined : category}
          type={type === 'all' ? undefined : type as any}
          columns={3}
          limit={100}
        />
      </section>
    </>
  );
}