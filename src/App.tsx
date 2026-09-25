/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TOWNS, FLAT_TYPES } from '../constants.js';
import {
  Building2,
  TrendingUp,
  Calendar,
  Layers,
  AlertCircle,
  AlertTriangle,
  WifiOff,
  Loader2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  X,
  Home,
  MessageSquare,
  ChevronDown,
  Heart,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface DisqusConfig {
  page: {
    url?: string;
    identifier?: string;
  };
}

declare global {
  interface Window {
    disqus_config?: (this: DisqusConfig) => void;
    disqus_shortname?: string;
    DISQUS?: {
      reset: (options: { reload: boolean; config?: (this: DisqusConfig) => void }) => void;
    };
  }
}

interface LocalComment {
  id: string;
  name: string;
  content: string;
  timestamp: number;
  upvotes: number;
  downvotes: number;
  provider?: string;
}

const REACTIONS_CONFIG = [
  { id: 'upvote', emoji: '👍', label: 'Upvote' },
  { id: 'funny', emoji: '😝', label: 'Funny' },
  { id: 'love', emoji: '😍', label: 'Love' },
  { id: 'surprised', emoji: '😲', label: 'Surprised' },
  { id: 'angry', emoji: '😤', label: 'Angry' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
];

function DisqusComments() {
  const [comments, setComments] = useState<LocalComment[]>(() => {
    try {
      const saved = localStorage.getItem('hdb_feedback_comments_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('hdb_reaction_counts_v1');
      return saved ? JSON.parse(saved) : {
        upvote: 0,
        funny: 0,
        love: 0,
        surprised: 0,
        angry: 0,
        sad: 0,
      };
    } catch {
      return { upvote: 0, funny: 0, love: 0, surprised: 0, angry: 0, sad: 0 };
    }
  });

  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loginProvider, setLoginProvider] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'best' | 'newest' | 'oldest'>('best');
  const [liked, setLiked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize Disqus background integration
  useEffect(() => {
    const pageUrl = 'https://week-4-livid.vercel.app';
    const pageIdentifier = 'home';

    window.disqus_shortname = 'week3comment';
    window.disqus_config = function (this: DisqusConfig) {
      this.page.url = pageUrl;
      this.page.identifier = pageIdentifier;
    };

    try {
      if (window.DISQUS) {
        window.DISQUS.reset({
          reload: true,
          config: function (this: DisqusConfig) {
            this.page.url = pageUrl;
            this.page.identifier = pageIdentifier;
          },
        });
      } else if (!document.getElementById('disqus-embed-script')) {
        const script = document.createElement('script');
        script.id = 'disqus-embed-script';
        script.src = 'https://week3comment.disqus.com/embed.js';
        script.setAttribute('data-timestamp', (+new Date()).toString());
        script.async = true;
        script.crossOrigin = 'anonymous';
        (document.head || document.body).appendChild(script);
      }
    } catch {
      // Ignore cross-origin third-party script reset warnings
    }
  }, []);

  const totalResponses = useMemo(() => {
    return Object.values(reactionCounts).reduce((acc, curr) => acc + curr, 0);
  }, [reactionCounts]);

  const handleReaction = (id: string) => {
    setReactionCounts((prev) => {
      const isAlready = userReaction === id;
      const updated = {
        ...prev,
        [id]: Math.max(0, (prev[id] || 0) + (isAlready ? -1 : 1)),
      };
      try {
        localStorage.setItem('hdb_reaction_counts_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setUserReaction((prev) => (prev === id ? null : id));
  };

  const handlePostComment = () => {
    if (!commentText.trim()) return;

    const newEntry: LocalComment = {
      id: Date.now().toString(),
      name: authorName.trim() || 'Guest User',
      content: commentText.trim(),
      timestamp: Date.now(),
      upvotes: 0,
      downvotes: 0,
      provider: loginProvider || 'Guest',
    };

    const next = [newEntry, ...comments];
    setComments(next);
    try {
      localStorage.setItem('hdb_feedback_comments_v1', JSON.stringify(next));
    } catch {}

    setCommentText('');
  };

  const handleVoteComment = (id: string, delta: number) => {
    setComments((prev) => {
      const next = prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            upvotes: Math.max(0, c.upvotes + delta),
          };
        }
        return c;
      });
      try {
        localStorage.setItem('hdb_feedback_comments_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const sortedComments = useMemo(() => {
    const list = [...comments];
    if (sortBy === 'best') {
      return list.sort((a, b) => b.upvotes - a.upvotes);
    }
    if (sortBy === 'newest') {
      return list.sort((a, b) => b.timestamp - a.timestamp);
    }
    if (sortBy === 'oldest') {
      return list.sort((a, b) => a.timestamp - b.timestamp);
    }
    return list;
  }, [comments, sortBy]);

  const getTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs">
      {/* Title & Subtitle */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Feedback &amp; Comments
        </h2>
        <p className="text-slate-600 text-sm sm:text-base mt-2">
          Tell us what worked for you and what did not.
        </p>
      </div>

      {/* Reactions Section: "What do you think?" */}
      <div className="text-center py-6 mb-10 border-b border-slate-100">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          What do you think?
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 mb-8">
          {totalResponses} {totalResponses === 1 ? 'Response' : 'Responses'}
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6 max-w-2xl mx-auto">
          {REACTIONS_CONFIG.map((r) => {
            const isSelected = userReaction === r.id;
            const count = reactionCounts[r.id] || 0;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleReaction(r.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl transition cursor-pointer group hover:bg-slate-50 active:scale-95 ${
                  isSelected ? 'bg-blue-50 ring-2 ring-blue-500 shadow-xs' : ''
                }`}
              >
                <span className="text-4xl sm:text-5xl transition-transform group-hover:scale-110 drop-shadow-xs">
                  {r.emoji}
                </span>
                <span className={`text-xs font-semibold mt-2 ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                  {r.label}
                </span>
                {count > 0 && (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comments Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-300">
        <h4 className="text-base sm:text-lg font-bold text-slate-900">
          {comments.length} Comments
        </h4>
        <div className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold text-xs sm:text-sm hover:text-slate-900">
          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
            1
          </span>
          <span>Login</span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </div>
      </div>

      {/* Comment Input Discussion Area */}
      <div className="mt-6 space-y-4">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Avatar 'G' matching screenshot */}
          <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-xs">
            {authorName ? authorName.charAt(0).toUpperCase() : 'G'}
          </div>

          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Start the discussion..."
              rows={3}
              className="w-full border-2 border-slate-300 rounded-2xl p-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition resize-none bg-white"
            />

            {/* Social Logins & Sign up with Disqus */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-3 pt-1">
              <div className="flex items-center flex-wrap gap-2.5">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  LOG IN WITH
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginProvider('Disqus');
                      if (!authorName) setAuthorName('Disqus User');
                    }}
                    title="Log in with Disqus"
                    className="w-7 h-7 rounded-full bg-[#2e9fff] text-white flex items-center justify-center font-bold text-xs hover:opacity-90 transition cursor-pointer"
                  >
                    D
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginProvider('Facebook');
                      if (!authorName) setAuthorName('Facebook User');
                    }}
                    title="Log in with Facebook"
                    className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs hover:opacity-90 transition cursor-pointer"
                  >
                    f
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginProvider('X');
                      if (!authorName) setAuthorName('X User');
                    }}
                    title="Log in with X"
                    className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px] hover:opacity-90 transition cursor-pointer"
                  >
                    𝕏
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginProvider('Google');
                      if (!authorName) setAuthorName('Google User');
                    }}
                    title="Log in with Google"
                    className="w-7 h-7 rounded-full bg-[#EA4335] text-white flex items-center justify-center font-bold text-xs hover:opacity-90 transition cursor-pointer"
                  >
                    G
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginProvider('Microsoft');
                      if (!authorName) setAuthorName('Microsoft User');
                    }}
                    title="Log in with Microsoft"
                    className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 text-slate-800 flex items-center justify-center p-1.5 hover:bg-slate-200 transition cursor-pointer"
                  >
                    <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
                      <div className="bg-[#f25022]"></div>
                      <div className="bg-[#7fba00]"></div>
                      <div className="bg-[#00a4ef]"></div>
                      <div className="bg-[#ffb900]"></div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginProvider('Apple');
                      if (!authorName) setAuthorName('Apple User');
                    }}
                    title="Log in with Apple"
                    className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-bold text-[11px] hover:opacity-90 transition cursor-pointer"
                  >
                    
                  </button>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2.5">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  OR SIGN UP WITH DISQUS
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 w-36 sm:w-44 focus:outline-hidden focus:border-blue-500 bg-white"
                />
                <button
                  type="button"
                  onClick={handlePostComment}
                  disabled={!commentText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discussion Footer Controls */}
      <div className="flex items-center justify-between pt-6 mt-4 border-t border-slate-100 text-sm">
        <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm">
          <button
            onClick={() => setLiked((l) => !l)}
            className="p-1 hover:text-rose-500 transition cursor-pointer"
            title="Like discussion"
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
          <span>•</span>
          <button
            onClick={handleShare}
            className="hover:text-slate-800 transition font-medium text-xs cursor-pointer flex items-center gap-1"
          >
            <span>Share</span>
            {copiedLink && <span className="text-emerald-600 text-[11px] font-semibold">(Link copied!)</span>}
          </button>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setSortBy('best')}
            className={`pb-1 cursor-pointer transition ${
              sortBy === 'best'
                ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Best
          </button>
          <button
            onClick={() => setSortBy('newest')}
            className={`pb-1 cursor-pointer transition ${
              sortBy === 'newest'
                ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => setSortBy('oldest')}
            className={`pb-1 cursor-pointer transition ${
              sortBy === 'oldest'
                ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Oldest
          </button>
        </div>
      </div>

      {/* Comment Thread List */}
      <div className="mt-6 space-y-4">
        {sortedComments.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            Be the first to comment.
          </div>
        ) : (
          sortedComments.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 transition hover:border-slate-300"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{c.name}</span>
                    {c.provider && c.provider !== 'Guest' && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                        via {c.provider}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">{getTimeAgo(c.timestamp)}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {c.content}
                </p>
                <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-500 font-medium">
                  <button
                    onClick={() => handleVoteComment(c.id, 1)}
                    className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{c.upvotes || 0}</span>
                  </button>
                  <button
                    onClick={() => handleVoteComment(c.id, -1)}
                    className="flex items-center gap-1 hover:text-rose-600 cursor-pointer transition"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Official background Disqus container for shortname week3comment */}
      <div id="disqus_thread" className="hidden"></div>
    </div>
  );
}

interface TransactionItem {
  id: number | string;
  month: string;
  block: string;
  street_name: string;
  storey_range: string;
  floor_area_sqm: string;
  flat_model: string;
  lease_commence_date: string;
  remaining_lease: string;
  resale_price: number;
}

interface ResaleData {
  town: string;
  flat_type: string;
  latest_month: string | null;
  transactions_used: number;
  typical_price: number | null;
  transactions?: TransactionItem[];
}

type ViewState =
  | { status: 'loading' }
  | { status: 'empty'; town: string; flatType: string }
  | { status: 'refused'; reason: string }
  | { status: 'unreachable' }
  | { status: 'success'; data: ResaleData };

interface HealthData {
  keyConfigured: string;
  upstreamAnswered: boolean;
  upstreamStatus: number | null;
}

type SortField = 'date_desc' | 'date_asc' | 'price_desc' | 'price_asc' | 'area_desc';

export default function App() {
  const [selectedTown, setSelectedTown] = useState<string>('ANG MO KIO');
  const [selectedFlatType, setSelectedFlatType] = useState<string>('4 ROOM');
  const [viewState, setViewState] = useState<ViewState>({ status: 'loading' });
  const [healthInfo, setHealthInfo] = useState<HealthData | null>(null);
  const [isHealthChecking, setIsHealthChecking] = useState<boolean>(false);

  // Transaction table filters and pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortField>('date_desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Request race-condition prevention: AbortController and Request ID tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentRequestIdRef = useRef<number>(0);

  const fetchResaleData = (town: string, flatType: string) => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const thisRequestId = ++currentRequestIdRef.current;

    setViewState({ status: 'loading' });
    setSearchQuery('');
    setCurrentPage(1);

    const searchParams = new URLSearchParams({
      town: town,
      flat_type: flatType,
    });

    fetch(`/api/resale?${searchParams.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        // Discard response if request is obsolete
        if (thisRequestId !== currentRequestIdRef.current) {
          return;
        }

        if (!response.ok) {
          let errorMsg = `HTTP ${response.status}`;
          try {
            const errBody = await response.json();
            if (errBody?.error) {
              errorMsg = errBody.error;
            }
          } catch {
            // response was not JSON
          }

          if (response.status === 502 || response.status === 503 || errorMsg.toLowerCase().includes('unreachable')) {
            setViewState({ status: 'unreachable' });
          } else {
            setViewState({
              status: 'refused',
              reason: errorMsg,
            });
          }
          return;
        }

        const data: ResaleData = await response.json();

        // Discard response if request is obsolete
        if (thisRequestId !== currentRequestIdRef.current) {
          return;
        }

        if (data.typical_price === null || data.transactions_used === 0) {
          setViewState({
            status: 'empty',
            town: data.town || town,
            flatType: data.flat_type || flatType,
          });
        } else {
          setViewState({
            status: 'success',
            data,
          });
        }
      })
      .catch((err: any) => {
        // If aborted, do nothing (new request is already in flight)
        if (err.name === 'AbortError') {
          return;
        }

        if (thisRequestId === currentRequestIdRef.current) {
          setViewState({ status: 'unreachable' });
        }
      });
  };

  useEffect(() => {
    fetchResaleData(selectedTown, selectedFlatType);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedTown, selectedFlatType]);

  const checkHealth = async () => {
    setIsHealthChecking(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthInfo(data);
      } else {
        setHealthInfo({
          keyConfigured: 'not required',
          upstreamAnswered: false,
          upstreamStatus: res.status,
        });
      }
    } catch {
      setHealthInfo({
        keyConfigured: 'not required',
        upstreamAnswered: false,
        upstreamStatus: null,
      });
    } finally {
      setIsHealthChecking(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMonth = (monthStr: string | null) => {
    if (!monthStr) return 'N/A';
    const parts = monthStr.split('-');
    if (parts.length === 2) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${monthNames[monthIndex]} ${year} (${monthStr})`;
      }
    }
    return monthStr;
  };

  // Filtered and sorted transactions list
  const rawTransactions = viewState.status === 'success' ? viewState.data.transactions || [] : [];

  const filteredTransactions = useMemo(() => {
    if (!rawTransactions.length) return [];

    let list = rawTransactions.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.street_name.toLowerCase().includes(q) ||
        item.block.toLowerCase().includes(q) ||
        item.flat_model.toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      if (sortOption === 'date_desc') {
        const c = b.month.localeCompare(a.month);
        return c !== 0 ? c : Number(b.id) - Number(a.id);
      }
      if (sortOption === 'date_asc') {
        const c = a.month.localeCompare(b.month);
        return c !== 0 ? c : Number(a.id) - Number(b.id);
      }
      if (sortOption === 'price_desc') {
        return b.resale_price - a.resale_price;
      }
      if (sortOption === 'price_asc') {
        return a.resale_price - b.resale_price;
      }
      if (sortOption === 'area_desc') {
        return parseFloat(b.floor_area_sqm || '0') - parseFloat(a.floor_area_sqm || '0');
      }
      return 0;
    });

    return list;
  }, [rawTransactions, searchQuery, sortOption]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Singapore HDB Resale Prices
              </h1>
              <p className="text-xs text-slate-500">
                Live datastore records from data.gov.sg
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={checkHealth}
              disabled={isHealthChecking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Test /api/health endpoint"
            >
              {isHealthChecking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>API Health</span>
            </button>

            {healthInfo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                Upstream:{' '}
                {healthInfo.upstreamAnswered ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> {healthInfo.upstreamStatus}
                  </span>
                ) : (
                  <span className="text-rose-600 font-semibold flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3" /> Error
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-8">
        {/* Selection Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-800">
              Select Town and Flat Type
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select any Singapore HDB town and flat type to view the latest typical median resale figure and list previous transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Town Selector */}
            <div>
              <label
                htmlFor="town-select"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2"
              >
                HDB Town ({TOWNS.length} available)
              </label>
              <div className="relative">
                <select
                  id="town-select"
                  value={selectedTown}
                  onChange={(e) => setSelectedTown(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-medium appearance-none focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 transition cursor-pointer text-sm"
                >
                  {TOWNS.map((town) => (
                    <option key={town} value={town}>
                      {town}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Flat Type Selector */}
            <div>
              <label
                htmlFor="flat-type-select"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2"
              >
                Flat Type ({FLAT_TYPES.length} available)
              </label>
              <div className="relative">
                <select
                  id="flat-type-select"
                  value={selectedFlatType}
                  onChange={(e) => setSelectedFlatType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-medium appearance-none focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 transition cursor-pointer text-sm"
                >
                  {FLAT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div className="space-y-6">
          {/* Case 1: Data is loading */}
          {viewState.status === 'loading' && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center text-blue-900 shadow-xs transition">
              <div className="flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-base font-medium">
                  Fetching the latest resale transaction data for {selectedTown} ({selectedFlatType})...
                </p>
                <p className="text-xs text-blue-600">
                  Calling serverless endpoint /api/resale
                </p>
              </div>
            </div>
          )}

          {/* Case 2: Data is empty */}
          {viewState.status === 'empty' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center text-amber-900 shadow-xs">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <p className="text-base font-medium">
                  No resale transactions were found for {viewState.flatType} flats in {viewState.town} within the dataset.
                </p>
                <p className="text-xs text-amber-700 max-w-md">
                  Certain combinations, such as MULTI-GENERATION flats in smaller or newer estates, have zero recorded sales. Try switching to a different flat type or town.
                </p>
              </div>
            </div>
          )}

          {/* Case 3: Upstream refused */}
          {viewState.status === 'refused' && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-rose-900 shadow-xs">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-base font-medium">
                  The data.gov.sg service refused the request ({viewState.reason}).
                </p>
                <p className="text-xs text-rose-700">
                  Please verify parameter configurations or try again shortly.
                </p>
              </div>
            </div>
          )}

          {/* Case 4: Upstream unreachable */}
          {viewState.status === 'unreachable' && (
            <div className="bg-slate-100 border border-slate-300 rounded-2xl p-8 text-center text-slate-800 shadow-xs">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                  <WifiOff className="w-6 h-6" />
                </div>
                <p className="text-base font-medium">
                  The data.gov.sg service could not be reached. Please check network connectivity or try again shortly.
                </p>
                <p className="text-xs text-slate-500">
                  The upstream datastore endpoint did not respond to the serverless request.
                </p>
              </div>
            </div>
          )}

          {/* Success: Display live price statistics and list previous transactions */}
          {viewState.status === 'success' && (
            <>
              {/* Typical Price Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Selected Location &amp; Flat Type
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-lg font-bold text-slate-900">
                        {viewState.data.town}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        {viewState.data.flat_type}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                      Dataset Status
                    </span>
                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 justify-end mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Live Data Connected
                    </span>
                  </div>
                </div>

                {/* Price Highlight */}
                <div className="py-8 text-center">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Typical Resale Price (Median of Latest 3 Active Months)
                  </span>
                  <div className="mt-2 text-4xl sm:text-5xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                    <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 inline" />
                    <span>{formatPrice(viewState.data.typical_price!)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
                    Computed as the exact median of the latest 3 active months present in the datastore, ensuring robust figures even for low-volume flat categories.
                  </p>
                </div>

                {/* Statistical Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                  <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 border border-slate-100">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">
                        Latest Month Found
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {formatMonth(viewState.data.latest_month)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 border border-slate-100">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">
                        Transactions Used
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {viewState.data.transactions_used} recorded sales
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Previous Transactions List & Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-red-600" />
                      <h3 className="text-lg font-bold text-slate-900">
                        Previous Transactions
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {filteredTransactions.length} records
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Individual resale transactions recorded for {viewState.data.town} ({viewState.data.flat_type})
                    </p>
                  </div>

                  {/* Filters & Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Search box */}
                    <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search street or block..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setCurrentPage(1);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Sort selector */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <select
                        value={sortOption}
                        onChange={(e) => {
                          setSortOption(e.target.value as SortField);
                          setCurrentPage(1);
                        }}
                        className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
                      >
                        <option value="date_desc">Month (Newest)</option>
                        <option value="date_asc">Month (Oldest)</option>
                        <option value="price_desc">Price (High to Low)</option>
                        <option value="price_asc">Price (Low to High)</option>
                        <option value="area_desc">Floor Area (Largest)</option>
                      </select>
                    </div>

                    {/* Page size selector */}
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <span>Show:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Table or Cards */}
                {filteredTransactions.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium">No transactions match your search filter "{searchQuery}".</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                      Clear search filter
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Desktop / Tablet Table View */}
                    <div className="hidden sm:block overflow-x-auto mt-4">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                            <th className="py-3 px-3">Month</th>
                            <th className="py-3 px-3">Block &amp; Street</th>
                            <th className="py-3 px-3">Storey</th>
                            <th className="py-3 px-3">Area</th>
                            <th className="py-3 px-3">Model &amp; Remaining Lease</th>
                            <th className="py-3 px-3 text-right">Resale Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedTransactions.map((tx) => {
                            const isAboveMedian =
                              viewState.data.typical_price !== null &&
                              tx.resale_price > viewState.data.typical_price;
                            const isBelowMedian =
                              viewState.data.typical_price !== null &&
                              tx.resale_price < viewState.data.typical_price;

                            return (
                              <tr key={tx.id} className="hover:bg-slate-50 transition">
                                <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                                  {tx.month}
                                </td>
                                <td className="py-3 px-3 text-slate-900 font-medium whitespace-nowrap">
                                  Blk {tx.block} {tx.street_name}
                                </td>
                                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                  Level {tx.storey_range}
                                </td>
                                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                  <span className="font-semibold text-slate-800">
                                    {tx.floor_area_sqm} sqm
                                  </span>
                                  <span className="text-slate-400 block text-[10px]">
                                    ≈ {Math.round(parseFloat(tx.floor_area_sqm || '0') * 10.7639)} sqft
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-slate-600">
                                  <span className="font-medium text-slate-800 block">
                                    {tx.flat_model}
                                  </span>
                                  <span className="text-slate-400 text-[11px] block">
                                    {tx.remaining_lease || (tx.lease_commence_date ? `Lease: ${tx.lease_commence_date}` : '—')}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                  <span className="text-sm font-bold text-slate-900 block">
                                    {formatPrice(tx.resale_price)}
                                  </span>
                                  {viewState.data.typical_price && (
                                    <span
                                      className={`text-[10px] font-semibold ${
                                        isAboveMedian
                                          ? 'text-rose-600'
                                          : isBelowMedian
                                          ? 'text-emerald-600'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {isAboveMedian && `+${formatPrice(tx.resale_price - viewState.data.typical_price)} vs median`}
                                      {isBelowMedian && `-${formatPrice(viewState.data.typical_price - tx.resale_price)} vs median`}
                                      {!isAboveMedian && !isBelowMedian && 'At median price'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="sm:hidden space-y-3 mt-4">
                      {paginatedTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-semibold text-slate-500">
                                {tx.month}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900">
                                Blk {tx.block} {tx.street_name}
                              </h4>
                            </div>
                            <span className="text-base font-extrabold text-slate-900">
                              {formatPrice(tx.resale_price)}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Storey</span>
                              <span className="font-medium text-slate-800">Level {tx.storey_range}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Floor Area</span>
                              <span className="font-medium text-slate-800">
                                {tx.floor_area_sqm} sqm ({Math.round(parseFloat(tx.floor_area_sqm || '0') * 10.7639)} sqft)
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Model &amp; Lease</span>
                              <span className="font-medium text-slate-800">
                                {tx.flat_model} · {tx.remaining_lease}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 mt-4 border-t border-slate-100 text-xs text-slate-600">
                      <div>
                        Showing{' '}
                        <span className="font-semibold text-slate-900">
                          {Math.min(filteredTransactions.length, (currentPage - 1) * pageSize + 1)}
                        </span>{' '}
                        to{' '}
                        <span className="font-semibold text-slate-900">
                          {Math.min(filteredTransactions.length, currentPage * pageSize)}
                        </span>{' '}
                        of{' '}
                        <span className="font-semibold text-slate-900">
                          {filteredTransactions.length}
                        </span>{' '}
                        transactions
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage <= 1}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous</span>
                        </button>

                        <span className="px-2 font-medium">
                          Page {currentPage} of {totalPages}
                        </span>

                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage >= totalPages}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Disqus Comment Section */}
        <DisqusComments />
      </main>

      {/* Footer with exact Singapore Open Data Licence attribution */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-2 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="leading-relaxed">
            Contains information from{' '}
            <span className="font-semibold text-slate-700">HDB Resale Flat Prices</span> accessed
            on <span className="font-semibold text-slate-700">24 September 2026</span> from{' '}
            <a
              href="https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:underline font-medium inline-flex items-center gap-0.5"
            >
              data.gov.sg
              <ExternalLink className="w-3 h-3" />
            </a>{' '}
            which is made available under the terms of the{' '}
            <a
              href="https://data.gov.sg/open-data-licence"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:underline font-medium inline-flex items-center gap-0.5"
            >
              Singapore Open Data Licence version 1.0
              <ExternalLink className="w-3 h-3" />
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
