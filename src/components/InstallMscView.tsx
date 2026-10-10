import React, { useState } from 'react';
import {
  Download,
  Terminal,
  Monitor,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Laptop,
  HelpCircle,
  Sparkles,
  FolderDown,
  Archive,
  FileText,
  Layers,
  FolderOpen
} from 'lucide-react';
import { AppSettings } from '../types';
import {
  downloadMscFile,
  downloadBatInstaller,
  downloadWindowsUrlShortcut,
  downloadPowerShellInstaller,
  generateAndDownloadZipBundle,
  downloadAllIndividualPackages
} from '../utils/mscInstaller';

interface InstallMscViewProps {
  settings: AppSettings;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export const InstallMscView: React.FC<InstallMscViewProps> = ({ settings, onShowToast }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingMsc, setDownloadingMsc] = useState(false);
  const [downloadingBat, setDownloadingBat] = useState(false);

  const appName = settings.applicationName || 'Justice Schedule';
  const orgName = settings.organizationName || 'High Court & District Judiciary';
  const cleanName = appName.replace(/\s+/g, '');

  // 1. Download Complete All-In-One ZIP Installer
  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      await generateAndDownloadZipBundle(settings, `${cleanName}-Complete-Installer.zip`);
      onShowToast('success', `Saved ${cleanName}-Complete-Installer.zip directly to your Downloads folder!`);
    } catch {
      // Fallback to server route if client-side zip fails
      window.location.href = '/api/download/full-package-zip';
      onShowToast('info', 'Downloading complete installation ZIP package to your Downloads folder...');
    } finally {
      setTimeout(() => setDownloadingZip(false), 2000);
    }
  };

  // 2. Download All Packages (Bundle + Individual Components)
  const handleDownloadAllPackages = async () => {
    setDownloadingAll(true);
    try {
      await downloadAllIndividualPackages(settings);
      onShowToast('success', 'All installer packages downloaded to your Downloads folder!');
    } catch {
      onShowToast('error', 'Error generating packages');
    } finally {
      setTimeout(() => setDownloadingAll(false), 2500);
    }
  };

  const handleDownloadMsc = () => {
    setDownloadingMsc(true);
    try {
      downloadMscFile(settings, `${cleanName}.msc`);
      onShowToast('success', `Saved ${cleanName}.msc to your Downloads folder!`);
    } catch {
      onShowToast('error', 'Failed to generate .msc file');
    } finally {
      setTimeout(() => setDownloadingMsc(false), 2000);
    }
  };

  const handleDownloadBat = () => {
    setDownloadingBat(true);
    try {
      downloadBatInstaller(settings, `Install-${cleanName}.bat`);
      onShowToast('success', `Saved Install-${cleanName}.bat to your Downloads folder!`);
    } catch {
      onShowToast('error', 'Failed to generate installer script');
    } finally {
      setTimeout(() => setDownloadingBat(false), 2000);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    onShowToast('info', `Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const powershellCommand = `Invoke-WebRequest -Uri "${window.location.origin}/api/download/msc" -OutFile "$env:USERPROFILE\\Downloads\\${cleanName}.msc"; & mmc.exe "$env:USERPROFILE\\Downloads\\${cleanName}.msc"`;

  const bundledPackagesList = [
    {
      name: 'Setup.bat',
      tag: 'Launcher',
      desc: '1-click setup launcher. Double-click inside your Downloads folder to start installation.',
      color: 'bg-emerald-100 text-emerald-800'
    },
    {
      name: `${cleanName}.msc`,
      tag: 'Windows MMC',
      desc: 'Native Microsoft Management Console document. Double-click in Windows to launch via mmc.exe.',
      color: 'bg-amber-100 text-amber-800'
    },
    {
      name: `Install-${cleanName}.bat`,
      tag: 'Windows Installer',
      desc: 'Automated installer script. Deploys the .msc file and creates Desktop & Start Menu shortcuts.',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      name: `Install-${cleanName}.ps1`,
      tag: 'PowerShell',
      desc: 'PowerShell script for silent deployment across courtroom workstations and networks.',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      name: `${appName}.url`,
      tag: 'Desktop Shortcut',
      desc: 'Windows Desktop Internet Shortcut that opens your judicial management system directly.',
      color: 'bg-slate-100 text-slate-800'
    },
    {
      name: 'Register-Windows-Startup.bat',
      tag: 'Startup Tool',
      desc: 'Configures Justice Schedule to automatically launch when your Windows computer starts up.',
      color: 'bg-cyan-100 text-cyan-800'
    },
    {
      name: 'Uninstall-JusticeSchedule.bat',
      tag: 'Uninstaller',
      desc: 'Cleanly removes desktop shortcuts and installed files if ever required.',
      color: 'bg-rose-100 text-rose-800'
    },
    {
      name: 'README-INSTALLATION.txt',
      tag: 'Guide',
      desc: 'Complete text instructions for installing, configuring, and running on Windows.',
      color: 'bg-yellow-100 text-yellow-800'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Header with Download Location Notice */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Archive className="w-72 h-72 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>All-in-One Windows Installer & Deployment Package</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-white">
            Download Complete Windows Installer Package
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Download all installation packages for <strong className="text-amber-300">{appName}</strong> in a single bundle.
            Your browser will save the complete package directly to your computer's <strong className="text-white underline decoration-amber-400 decoration-2">Downloads folder</strong>.
          </p>

          {/* Download Destination Notice */}
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80 flex items-center gap-3 text-xs text-slate-300">
            <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Target Location: <code className="text-amber-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">Downloads\{cleanName}-Complete-Installer.zip</code>
            </span>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadZip}
              disabled={downloadingZip}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              {downloadingZip ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Downloading to Downloads Folder...</span>
                </>
              ) : (
                <>
                  <FolderDown className="w-4 h-4 text-slate-950" />
                  <span>Download All-in-One Installer Package (.ZIP)</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadAllPackages}
              disabled={downloadingAll}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold border border-slate-700 rounded-lg text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              {downloadingAll ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Downloading All Packages...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Download All Packages Separately</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Package Contents Breakdown Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-600" />
              <span>Packages Included in the Download</span>
            </h3>
            <p className="text-xs text-slate-500">
              Everything required to install and run on Windows is bundled together
            </p>
          </div>

          <button
            onClick={handleDownloadZip}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Download .ZIP</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {bundledPackagesList.map((pkg, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col justify-between space-y-2 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  {pkg.name}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${pkg.color}`}>
                  {pkg.tag}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-normal">
                {pkg.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Download Cards Grid for Individual Files */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: .MSC File */}
        <div className="bg-white border-2 border-amber-300 rounded-xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Monitor className="w-5 h-5" />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700">Windows Console</div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                {cleanName}.msc
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-normal">
              Direct Microsoft Management Console file. Double-click in Windows to launch in native <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">mmc.exe</code>.
            </p>

            <ul className="text-[11px] text-slate-600 space-y-1.5 pt-1">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Compatible with Windows 11, 10, 8, 7 & Server</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Zero installation dependencies</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={handleDownloadMsc}
              disabled={downloadingMsc}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingMsc ? 'Downloaded!' : 'Download .msc to Downloads'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: 1-Click Windows Setup (.bat) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <Terminal className="w-5 h-5 text-slate-800" />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Automated Setup</div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Install-{cleanName}.bat
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-normal">
              1-click setup script that installs the <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">.msc</code> file and creates Windows Desktop and Start Menu shortcuts.
            </p>

            <ul className="text-[11px] text-slate-600 space-y-1.5 pt-1">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Creates Windows Desktop Shortcut</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Adds to Windows Start Menu</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={handleDownloadBat}
              disabled={downloadingBat}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingBat ? 'Downloaded!' : 'Download .bat to Downloads'}</span>
            </button>
          </div>
        </div>

        {/* Card 3: Complete ZIP Package */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Archive className="w-5 h-5 text-emerald-700" />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Complete Archive</div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                All-in-One (.zip)
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-normal">
              Contains all 10 tools: `.msc`, `.bat` installer, `Setup.bat`, `.ps1`, desktop shortcut, uninstaller, and offline documentation.
            </p>

            <ul className="text-[11px] text-slate-600 space-y-1.5 pt-1">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Single archive for easy sharing / USB drive</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Includes offline guide & database schema</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={handleDownloadZip}
              disabled={downloadingZip}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>Download .ZIP to Downloads</span>
            </button>
          </div>
        </div>
      </div>

      {/* Step-by-Step Installation Instructions */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-900 font-serif">
            How to Install & Run from Your Downloads Folder
          </h3>
          <p className="text-xs text-slate-500">
            Follow these 3 easy steps on your Windows computer:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
              1
            </div>
            <h4 className="font-bold text-slate-800">Open Downloads Folder</h4>
            <p className="text-slate-600">
              Click <strong className="text-slate-800">"Download All-in-One Installer Package"</strong> above. Open your computer's standard <code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-slate-200">Downloads</code> folder.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
              2
            </div>
            <h4 className="font-bold text-slate-800">Extract the ZIP Archive</h4>
            <p className="text-slate-600">
              Right-click <code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-slate-200">{cleanName}-Complete-Installer.zip</code> and choose <strong className="text-slate-800">"Extract All..."</strong> then click Extract.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
              3
            </div>
            <h4 className="font-bold text-slate-800">Double-Click Setup.bat</h4>
            <p className="text-slate-600">
              Double-click <strong className="text-slate-800">Setup.bat</strong> (or <strong className="text-slate-800">{cleanName}.msc</strong>). The installer will configure shortcuts and launch your management console instantly!
            </p>
          </div>
        </div>

        {/* Direct PowerShell Quick Install One-Liner */}
        <div className="p-4 rounded-lg bg-slate-950 text-slate-200 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>Direct PowerShell Download (Downloads directly to your Downloads folder):</span>
            </span>
            <button
              onClick={() => copyToClipboard(powershellCommand, 'PowerShell Command')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedCmd === 'PowerShell Command' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Command</span>
                </>
              )}
            </button>
          </div>
          <div className="overflow-x-auto p-2.5 bg-slate-900 rounded border border-slate-800 text-amber-300 text-[11px] whitespace-pre">
            {powershellCommand}
          </div>
        </div>
      </div>

      {/* Windows Security & Offline Info Notice */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-3.5 text-xs text-emerald-950">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-emerald-900">
            Safe & 100% Offline-Compliant
          </h4>
          <p className="text-emerald-800/90 leading-relaxed">
            All files are built using standard Microsoft Windows management protocols. No external dependencies, runtimes, or administrative rights are required. Files saved in your Downloads folder can also be copied onto a USB flash drive for courtroom PCs without internet access.
          </p>
        </div>
      </div>
    </div>
  );
};
