import { useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { fileToDataUrl } from '@/lib/images';

/** Up to `max` small photos, stored as data URLs in the mock backend. */
export function PhotoPicker({
  photos,
  onChange,
  max = 3,
}: {
  photos: string[];
  onChange: (p: string[]) => void;
  max?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((p, i) => (
        <div key={i} className="relative h-16 w-16 overflow-hidden rounded-xl bg-gray-100">
          <img src={p} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(photos.filter((_, j) => j !== i))}
            className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white"
            aria-label={`Remove photo ${i + 1}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {photos.length < max && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="grid h-16 w-16 place-items-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-leaf-500 hover:text-leaf-600"
          aria-label="Add photo"
        >
          <Camera className="h-6 w-6" />
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])].slice(0, max - photos.length);
          const urls = await Promise.all(files.map((f) => fileToDataUrl(f)));
          onChange([...photos, ...urls]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
