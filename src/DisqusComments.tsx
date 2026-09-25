/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

declare global {
  interface Window {
    disqus_config?: (this: any) => void;
    disqus_shortname?: string;
    DISQUS?: {
      reset: (options: { reload: boolean; config?: (this: any) => void }) => void;
    };
  }
}

export default function DisqusComments() {
  const [loadStatus, setLoadStatus] = useState<'loading' | 'loaded' | 'blocked'>('loading');

  useEffect(() => {
    const disqusShortname = 'week-4-livid-vercel-app';
    const pageUrl = 'https://week-4-livid.vercel.app';
    const pageIdentifier = 'home';

    window.disqus_shortname = disqusShortname;
    window.disqus_config = function () {
      this.page.url = pageUrl;
      this.page.identifier = pageIdentifier;
      this.callbacks = this.callbacks || {};
      this.callbacks.onReady = [
        function () {
          setLoadStatus('loaded');
        },
      ];
    };

    // If DISQUS is already present on the page, call reset with configuration
    if (window.DISQUS) {
      try {
        window.DISQUS.reset({
          reload: true,
          config: function () {
            this.page.url = pageUrl;
            this.page.identifier = pageIdentifier;
            this.callbacks = this.callbacks || {};
            this.callbacks.onReady = [
              function () {
                setLoadStatus('loaded');
              },
            ];
          },
        });
      } catch (err) {
        console.warn('Disqus reset notice:', err);
      }
      return;
    }

    // Standard Universal Code script injection
    const scriptId = 'disqus-embed-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://${disqusShortname}.disqus.com/embed.js`;
      script.setAttribute('data-timestamp', String(+new Date()));
      script.async = true;
      script.onload = () => {
        // When script loads, check if thread iframe renders
        setTimeout(() => {
          const thread = document.getElementById('disqus_thread');
          if (thread && thread.children.length > 0) {
            setLoadStatus('loaded');
          }
        }, 1500);
      };
      script.onerror = () => {
        setLoadStatus('blocked');
      };
      (document.head || document.body).appendChild(script);
    } else {
      // Script already in DOM; check if rendered or reload
      setTimeout(() => {
        const thread = document.getElementById('disqus_thread');
        if (thread && thread.children.length > 0) {
          setLoadStatus('loaded');
        }
      }, 1000);
    }

    // Fallback timer: if after 5 seconds neither iframe nor error fired, check DOM
    const timer = setTimeout(() => {
      const thread = document.getElementById('disqus_thread');
      const hasIframe = thread && thread.querySelector('iframe');
      if (hasIframe) {
        setLoadStatus('loaded');
      } else if (loadStatus === 'loading') {
        // Likely blocked by browser tracking protection, adblocker, or cross-origin iframe restriction in preview
        setLoadStatus('blocked');
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mt-8">
      {/* Invitation line */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-800">
          Share what worked for you and what did not with the community below:
        </p>
      </div>

      {/* Disqus thread container */}
      <div id="disqus_thread" className="min-h-[220px]" />

      {/* Helper notice if browser or extension blocks Disqus script/iframe in iframe preview */}
      {loadStatus === 'blocked' && (
        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <p className="font-semibold text-amber-950">
            Disqus iframe is blocked by the browser in this sandbox preview
          </p>
          <p className="mt-1 text-amber-800 leading-relaxed">
            Browsers and extensions (like Brave Shields, uBlock Origin, or third-party cookie/tracker blockers) block Disqus from loading inside nested sandbox iframes.
            It will render normally on your live domain (<strong>https://week-4-livid.vercel.app</strong>), or you can open the live thread directly:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="https://week-4-livid.vercel.app#disqus_thread"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition text-xs shadow-xs"
            >
              Open Live Thread on week-4-livid.vercel.app
            </a>
            <a
              href="https://week-4-livid-vercel-app.disqus.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-medium transition text-xs"
            >
              View Disqus Forum Dashboard
            </a>
          </div>
        </div>
      )}

      <noscript>
        Please enable JavaScript to view the{' '}
        <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a>
      </noscript>
    </div>
  );
}
