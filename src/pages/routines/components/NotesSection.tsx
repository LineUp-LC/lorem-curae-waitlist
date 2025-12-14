import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';

interface Note {
  id: string;
  productName: string;
  productBrand: string;
  content: string;
  timestamp: Date;
  rating?: number;
  photos?: string[];
}

interface AIInsight {
  id: string;
  type: 'progress' | 'warning' | 'recommendation' | 'trend';
  title: string;
  content: string;
  confidence: number;
  basedOn: string[];
}

const mockNotes: Note[] = [
  {
    id: '1',
    productName: 'Vitamin C Brightening Serum',
    productBrand: 'Glow Naturals',
    content: 'After 2 weeks of use, I\'m noticing my dark spots are starting to fade! The texture is lightweight and absorbs quickly. No irritation so far. Using it every morning after cleansing.',
    timestamp: new Date('2024-01-15T08:30:00'),
    rating: 5,
    photos: [
      'https://readdy.ai/api/search-image?query=close-up%20of%20clear%20glowing%20facial%20skin%20showing%20reduced%20dark%20spots%20and%20even%20skin%20tone%20with%20natural%20lighting%20minimal%20background%20skincare%20progress%20photo%20style&width=400&height=400&seq=note1a&orientation=squarish',
      'https://readdy.ai/api/search-image?query=close-up%20of%20radiant%20healthy%20facial%20skin%20with%20improved%20texture%20and%20brightness%20natural%20daylight%20minimal%20background%20skincare%20after%20photo%20style&width=400&height=400&seq=note1b&orientation=squarish',
    ],
  },
  {
    id: '2',
    productName: 'Deep Hydration Moisturizer',
    productBrand: 'Skin Harmony',
    content: 'Great for my dry skin, especially during winter. Feels rich but not greasy. I\'ve been applying it twice daily and my skin feels so much softer.',
    timestamp: new Date('2024-01-10T21:15:00'),
    rating: 4,
    photos: [
      'https://readdy.ai/api/search-image?query=close-up%20of%20well-hydrated%20smooth%20facial%20skin%20with%20healthy%20glow%20natural%20lighting%20minimal%20background%20skincare%20progress%20documentation%20style&width=400&height=400&seq=note2a&orientation=squarish',
    ],
  },
  {
    id: '3',
    productName: 'Gentle Hydrating Cleanser',
    productBrand: 'Pure Essence',
    content: 'This cleanser is so gentle! Doesn\'t strip my skin at all. Perfect for my sensitive skin. Using it morning and night.',
    timestamp: new Date('2024-01-05T07:45:00'),
    rating: 5,
  },
  {
    id: '4',
    productName: 'Mineral Sunscreen SPF 50',
    productBrand: 'Clarity Labs',
    content: 'No white cast which is amazing! Sits well under makeup. Reapplying every 2 hours when I\'m outdoors. Skin feels protected.',
    timestamp: new Date('2023-12-28T09:00:00'),
    rating: 4,
    photos: [
      'https://readdy.ai/api/search-image?query=close-up%20of%20protected%20healthy%20facial%20skin%20with%20sunscreen%20application%20natural%20outdoor%20lighting%20minimal%20background%20skincare%20documentation%20style&width=400&height=400&seq=note4a&orientation=squarish',
      'https://readdy.ai/api/search-image?query=close-up%20of%20smooth%20even-toned%20facial%20skin%20showing%20sun%20protection%20results%20natural%20lighting%20minimal%20background%20skincare%20progress%20style&width=400&height=400&seq=note4b&orientation=squarish',
      'https://readdy.ai/api/search-image?query=close-up%20of%20radiant%20well-protected%20facial%20skin%20with%20healthy%20appearance%20natural%20daylight%20minimal%20background%20skincare%20after%20photo%20style&width=400&height=400&seq=note4c&orientation=squarish',
    ],
  },
];

// Mock AI insights based on the notes
const mockAIInsights: AIInsight[] = [
  {
    id: '1',
    type: 'progress',
    title: 'Significant Improvement in Hyperpigmentation',
    content: 'Based on your notes and photos, your dark spots have shown 35% improvement over the past 2 weeks. The Vitamin C serum is delivering visible results. Continue this routine for optimal outcomes.',
    confidence: 92,
    basedOn: ['Vitamin C serum notes', 'Progress photos', 'Timeline analysis']
  },
  {
    id: '2',
    type: 'recommendation',
    title: 'Consider Adding a Hydrating Toner',
    content: 'Your skin is responding well to hydration. Adding a hyaluronic acid toner between cleansing and serum could enhance your results by 25% based on similar skin profiles.',
    confidence: 87,
    basedOn: ['Moisturizer effectiveness', 'Skin type analysis', 'Routine gaps']
  },
  {
    id: '3',
    type: 'trend',
    title: 'Consistent Morning Routine Success',
    content: 'Your morning routine adherence is excellent (95% consistency). This consistency is a key factor in your positive results. Keep maintaining this schedule.',
    confidence: 94,
    basedOn: ['Usage frequency notes', 'Application timing', 'Results correlation']
  },
  {
    id: '4',
    type: 'warning',
    title: 'Monitor for Potential Over-Exfoliation',
    content: 'While your skin is tolerating the Vitamin C well, watch for any signs of sensitivity as you continue. Consider using it every other day if any irritation develops.',
    confidence: 78,
    basedOn: ['Product sensitivity patterns', 'Usage frequency', 'Skin type analysis']
  }
];

import AIAssistant from './AIAssistant';

export default function NotesSection() {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [aiInsights] = useState<AIInsight[]>(mockAIInsights);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // New note form state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({
    productName: '',
    productBrand: '',
    content: '',
    rating: 0,
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newPhotos: string[] = [];

    try {
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `routine-notes/${fileName}`;

        const { data, error } = await supabase.storage
          .from('user-uploads')
          .upload(filePath, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(filePath);

        newPhotos.push(urlData.publicUrl);
      }

      setUploadedPhotos([...uploadedPhotos, ...newPhotos]);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index));
  };

  const handleSaveNote = async () => {
    if (!newNote.productName || !newNote.content) {
      alert('Please fill in product name and note content');
      return;
    }

    const noteToAdd: Note = {
      id: Date.now().toString(),
      productName: newNote.productName,
      productBrand: newNote.productBrand || 'Unknown Brand',
      content: newNote.content,
      timestamp: new Date(),
      rating: newNote.rating || undefined,
      photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
    };

    // Add to local state
    setNotes([noteToAdd, ...notes]);

    // Save to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('routine_notes').insert({
          user_id: user.id,
          product_name: noteToAdd.productName,
          product_brand: noteToAdd.productBrand,
          content: noteToAdd.content,
          rating: noteToAdd.rating,
          photos: noteToAdd.photos,
          created_at: noteToAdd.timestamp.toISOString(),
        });
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }

    // Reset form
    setNewNote({ productName: '', productBrand: '', content: '', rating: 0 });
    setUploadedPhotos([]);
    setIsAddingNote(false);
  };

  const handleRefreshAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis refresh
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  const generateNewInsights = () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const groupNotesByDate = (notes: Note[]) => {
    const groups: { [key: string]: Note[] } = {};
    
    notes.forEach(note => {
      const dateKey = formatDate(note.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(note);
    });

    return groups;
  };

  const groupedNotes = groupNotesByDate(notes);

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'progress': return 'ri-trending-up-line';
      case 'warning': return 'ri-alert-line';
      case 'recommendation': return 'ri-lightbulb-line';
      case 'trend': return 'ri-bar-chart-line';
      default: return 'ri-information-line';
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'progress': return 'from-green-500 to-emerald-600';
      case 'warning': return 'from-amber-500 to-orange-600';
      case 'recommendation': return 'from-blue-500 to-indigo-600';
      case 'trend': return 'from-purple-500 to-violet-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Add Note Section */}
      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#2C5F4F] to-[#3D7A63] flex items-center justify-center">
              <i className="ri-add-line text-white text-2xl"></i>
            </div>
            <div>
              <h2 className="font-['Cormorant_Garamond'] text-3xl font-bold text-[#2C5F4F]">
                Add Product Note
              </h2>
              <p className="text-gray-600 text-sm">
                Track your skincare journey with notes and photos
              </p>
            </div>
          </div>
          {!isAddingNote && (
            <button
              onClick={() => setIsAddingNote(true)}
              className="px-6 py-3 bg-[#2C5F4F] text-white rounded-lg hover:bg-[#234839] transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <i className="ri-edit-line"></i>
              New Note
            </button>
          )}
        </div>

        {isAddingNote && (
          <div className="space-y-6">
            {/* Product Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={newNote.productName}
                  onChange={(e) => setNewNote({ ...newNote, productName: e.target.value })}
                  placeholder="e.g., Vitamin C Serum"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5F4F] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={newNote.productBrand}
                  onChange={(e) => setNewNote({ ...newNote, productBrand: e.target.value })}
                  placeholder="e.g., Glow Naturals"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5F4F] focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating (Optional)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewNote({ ...newNote, rating: star })}
                    className="cursor-pointer"
                  >
                    <i
                      className={`${
                        star <= newNote.rating
                          ? 'ri-star-fill text-[#E8956C]'
                          : 'ri-star-line text-gray-300'
                      } text-2xl`}
                    ></i>
                  </button>
                ))}
                {newNote.rating > 0 && (
                  <button
                    onClick={() => setNewNote({ ...newNote, rating: 0 })}
                    className="ml-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Note Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Notes *
              </label>
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Share your experience... Be specific about application time, skin reactions, visible changes, etc."
                rows={6}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5F4F] focus:border-transparent text-sm resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Be detailed for better AI insights
                </p>
                <p className="text-xs text-gray-500">
                  {newNote.content.length}/500
                </p>
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress Photos (Optional, max 5)
              </label>
              <div className="space-y-4">
                {/* Upload Button */}
                <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#2C5F4F] transition-colors cursor-pointer bg-gray-50">
                  <div className="text-center">
                    <i className="ri-camera-line text-4xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-600 mb-1">
                      {isUploading ? 'Uploading...' : 'Click to upload photos'}
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG up to 10MB each
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={isUploading || uploadedPhotos.length >= 5}
                    className="hidden"
                  />
                </label>

                {/* Uploaded Photos Preview */}
                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                        <img
                          src={photo}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveNote}
                disabled={!newNote.productName || !newNote.content}
                className="flex-1 px-6 py-3 bg-[#2C5F4F] text-white rounded-lg hover:bg-[#234839] transition-colors font-medium whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="ri-save-line mr-2"></i>
                Save Note
              </button>
              <button
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNote({ productName: '', productBrand: '', content: '', rating: 0 });
                  setUploadedPhotos([]);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guidance Banner */}
      <div className="bg-gradient-to-r from-[#2C5F4F] to-[#3D7A63] rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <i className="ri-ai-generate text-2xl"></i>
          </div>
          <div className="flex-1">
            <h3 className="font-['Cormorant_Garamond'] text-2xl font-bold mb-2">
              📝 Get Better AI Insights
            </h3>
            <p className="text-white/90 mb-4 leading-relaxed">
              <strong>Be as specific as possible</strong> when logging your skin journey! The more detailed your notes, the better our AI can analyze your progress and provide personalized recommendations.
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-white">✅ Good Examples:</h4>
                <ul className="text-white/80 space-y-1">
                  <li>• "Applied 3 drops after cleansing at 8am"</li>
                  <li>• "Noticed 2 new breakouts on left cheek"</li>
                  <li>• "Skin feels tight 30 mins after application"</li>
                  <li>• "Dark spots under eyes appear 20% lighter"</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-white">❌ Avoid Vague Notes:</h4>
                <ul className="text-white/80 space-y-1">
                  <li>• "Skin looks better"</li>
                  <li>• "Used product today"</li>
                  <li>• "Some improvement"</li>
                  <li>• "Feeling good about routine"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#2C5F4F] to-[#3D7A63] flex items-center justify-center">
              <i className="ri-brain-line text-white text-2xl"></i>
            </div>
            <div>
              <h2 className="font-['Cormorant_Garamond'] text-3xl font-bold text-[#2C5F4F]">
                AI Journey Insights
              </h2>
              <p className="text-gray-600 text-sm">
                Personalized analysis based on your notes and photos
              </p>
            </div>
          </div>
          <button
            onClick={handleRefreshAnalysis}
            disabled={isAnalyzing}
            className="px-6 py-3 bg-[#2C5F4F] text-white rounded-lg hover:bg-[#234839] transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <i className={`ri-refresh-line ${isAnalyzing ? 'animate-spin' : ''}`}></i>
            Refresh Analysis
          </button>
        </div>

        {/* Horizontal Insights Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Progress Insight */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <i className="ri-line-chart-line text-gray-600"></i>
                </div>
                <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                  92% confidence
                </span>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Significant Improvement in Hyperpigmentation
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Based on your notes and photos, your dark spots have shown 35% improvement over the past 2 weeks. 
              The Vitamin C serum is delivering visible results.
            </p>
            <p className="text-xs text-gray-500">
              Based on 8 progress photos + notes
            </p>
          </div>

          {/* Recommendation Insight */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <i className="ri-lightbulb-line text-gray-600"></i>
                </div>
                <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                  87% confidence
                </span>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Optimize with Hyaluronic Acid
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Your skin shows signs of dehydration in morning photos. Adding a hyaluronic acid toner could 
              improve results by 25% based on similar skin profiles.
            </p>
            <p className="text-xs text-gray-500">
              Based on skin type analysis + routine gaps
            </p>
          </div>

          {/* Consistency Insight */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <i className="ri-calendar-check-line text-gray-600"></i>
                </div>
                <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                  95% confidence
                </span>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Excellent Routine Adherence
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              You've maintained 95% consistency over 3 weeks. This dedication is the key driver 
              behind your positive results. Keep it up!
            </p>
            <p className="text-xs text-gray-500">
              Based on 21 days of routine logs
            </p>
          </div>

          {/* Warning Insight */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <i className="ri-alert-line text-gray-600"></i>
                </div>
                <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                  78% confidence
                </span>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Monitor for Over-Exfoliation
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Recent notes mention increased sensitivity. Consider reducing AHA frequency 
              from daily to every other day to prevent irritation.
            </p>
            <p className="text-xs text-gray-500">
              Based on sensitivity keywords + usage frequency
            </p>
          </div>

          {/* Timing Insight */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <i className="ri-time-line text-gray-600"></i>
                </div>
                <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                  84% confidence
                </span>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Morning Routine Performs Best
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Your skin responds better to morning applications based on photo timestamps. 
              Evening applications show 15% less improvement.
            </p>
            <p className="text-xs text-gray-500">
              Based on application timing vs. results
            </p>
          </div>

          {/* Goal Progress Insight */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <i className="ri-target-line text-gray-600"></i>
                </div>
                <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                  91% confidence
                </span>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              On Track for Clear Skin Goal
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Based on current progress rate, you're 67% toward your clear skin goal. 
              Estimated completion in 4-6 weeks with continued routine.
            </p>
            <p className="text-xs text-gray-500">
              Based on goal timeline + progress rate
            </p>
          </div>
        </div>

        {/* Analysis Status */}
        {isAnalyzing && (
          <div className="mt-6 p-4 bg-[#F8F6F3] rounded-lg flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#2C5F4F] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[#2C5F4F] font-medium">Analyzing your skincare journey...</span>
          </div>
        )}
      </div>

      {/* AI Assistant Integration */}
      <div className="flex justify-end mb-8">
        <AIAssistant 
          productName="Your Skincare Routine"
          noteContent={notes.map(note => `${note.productName}: ${note.content}`).join(' | ')}
        />
      </div>

      {/* App Download Banner */}
      <div className="bg-gradient-to-r from-[#2C5F4F] to-[#3D7A63] rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <i className="ri-smartphone-line text-3xl"></i>
              </div>
              <div>
                <h2 className="font-['Cormorant_Garamond'] text-3xl font-bold">
                  Take Notes On-the-Go
                </h2>
                <p className="text-white/80 text-sm">
                  Download our mobile app for full note-taking features
                </p>
              </div>
            </div>
            <p className="text-white/90 mb-6 max-w-2xl">
              Track your skincare journey with detailed notes, photos, and progress tracking. Available on iOS and Android.
            </p>
            <div className="flex gap-4">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3 bg-white text-[#2C5F4F] rounded-lg hover:bg-gray-100 transition-colors font-medium cursor-pointer whitespace-nowrap"
              >
                <i className="ri-apple-fill text-2xl"></i>
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="text-sm font-bold">App Store</div>
                </div>
              </a>
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3 bg-white text-[#2C5F4F] rounded-lg hover:bg-gray-100 transition-colors font-medium cursor-pointer whitespace-nowrap"
              >
                <i className="ri-google-play-fill text-2xl"></i>
                <div className="text-left">
                  <div className="text-xs">Get it on</div>
                  <div className="text-sm font-bold">Google Play</div>
                </div>
              </a>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-48 h-48 rounded-2xl bg-white/10 flex items-center justify-center">
              <i className="ri-phone-line text-8xl text-white/30"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Notes History */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="mb-8">
          <h2 className="font-['Cormorant_Garamond'] text-3xl font-bold text-[#2C5F4F] mb-2">
            Your Product Notes History
          </h2>
          <p className="text-gray-600 text-sm">
            View your past observations and track your skincare journey
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          {Object.entries(groupedNotes).map(([dateKey, dateNotes]) => (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#2C5F4F]/10 flex items-center justify-center">
                    <i className="ri-calendar-line text-[#2C5F4F] text-xl"></i>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-['Cormorant_Garamond'] text-xl font-bold text-[#2C5F4F]">
                    {dateKey}
                  </h3>
                  <div className="h-px bg-gray-200 mt-2"></div>
                </div>
              </div>

              {/* Notes for this date */}
              <div className="ml-16 space-y-4">
                {dateNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-[#F8F6F3] rounded-xl p-6 border border-gray-200 hover:border-[#2C5F4F]/30 transition-all"
                  >
                    {/* Product Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{note.productBrand}</p>
                        <h4 className="font-medium text-[#2C5F4F] text-lg">
                          {note.productName}
                        </h4>
                      </div>
                      {note.rating && (
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`${
                                i < note.rating!
                                  ? 'ri-star-fill text-[#E8956C]'
                                  : 'ri-star-line text-gray-300'
                              } text-sm`}
                            ></i>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Progress Photos */}
                    {note.photos && note.photos.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <i className="ri-camera-line text-[#2C5F4F]"></i>
                          <span className="text-sm font-medium text-[#2C5F4F]">
                            Progress Photos ({note.photos.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {note.photos.map((photo, index) => (
                            <div
                              key={index}
                              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
                              onClick={() => setSelectedPhoto(photo)}
                            >
                              <img
                                src={photo}
                                alt={`Progress photo ${index + 1}`}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <i className="ri-zoom-in-line text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity"></i>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Note Content */}
                    <p className="text-gray-700 text-sm leading-relaxed mb-3">
                      {note.content}
                    </p>

                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <i className="ri-time-line"></i>
                      {note.timestamp.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (if no notes) */}
        {notes.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <i className="ri-file-list-3-line text-gray-400 text-4xl"></i>
            </div>
            <h3 className="font-['Cormorant_Garamond'] text-2xl font-bold text-gray-400 mb-2">
              No Notes Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Download our mobile app to start tracking your skincare journey
            </p>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h4 className="font-medium text-[#2C5F4F] mb-4">
            What You Can Do in the Mobile App:
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#2C5F4F]/10 flex items-center justify-center flex-shrink-0">
                <i className="ri-edit-line text-[#2C5F4F]"></i>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 text-sm mb-1">Detailed Notes</h5>
                <p className="text-xs text-gray-600">
                  Write comprehensive notes about each product's effects
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#2C5F4F]/10 flex items-center justify-center flex-shrink-0">
                <i className="ri-camera-line text-[#2C5F4F]"></i>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 text-sm mb-1">Photo Tracking</h5>
                <p className="text-xs text-gray-600">
                  Upload before/after photos to visualize progress
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#2C5F4F]/10 flex items-center justify-center flex-shrink-0">
                <i className="ri-notification-line text-[#2C5F4F]"></i>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 text-sm mb-1">Smart Reminders</h5>
                <p className="text-xs text-gray-600">
                  Get notified to log your observations regularly
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#2C5F4F]/10 flex items-center justify-center flex-shrink-0">
                <i className="ri-line-chart-line text-[#2C5F4F]"></i>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 text-sm mb-1">Progress Analytics</h5>
                <p className="text-xs text-gray-600">
                  See trends and improvements over time with charts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            onClick={() => setSelectedPhoto(null)}
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
          <img
            src={selectedPhoto}
            alt="Progress photo"
            className="max-w-full max-h-[90vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
