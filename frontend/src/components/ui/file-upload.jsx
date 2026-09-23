import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle2, X } from "lucide-react";
import { useDropzone } from "react-dropzone";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const FileUpload = ({
  onChange,
  accept = { "application/pdf": [".pdf"] },
  maxFiles = 1,
  title = "Upload Document",
  subtitle = "Drag & drop your file here or click to browse",
}) => {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (newFiles) => {
    const acceptedExtensions = Object.values(accept).flat().map((ext) => ext.toLowerCase());
    const validFiles = newFiles.filter((f) => {
      if (acceptedExtensions.length === 0) return true;
      const fileExt = "." + f.name.split(".").pop().toLowerCase();
      const isMimeMatch = Object.keys(accept).some((mime) => {
        if (mime.endsWith("/*")) {
          return f.type.startsWith(mime.split("/")[0] + "/");
        }
        return f.type === mime;
      });
      return isMimeMatch || acceptedExtensions.includes(fileExt);
    });
    setFiles(validFiles);
    if (onChange) {
      onChange(validFiles);
    }
  };

  const handleRemoveFile = (e, index) => {
    e.stopPropagation();
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    if (onChange) {
      onChange(updated);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: maxFiles > 1,
    noClick: true,
    accept: accept,
    onDrop: handleFileChange,
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="p-8 group/file block rounded-2xl cursor-pointer w-full relative overflow-hidden glass-card border-2 border-dashed border-blue-500/50 hover:border-blue-400 dark:border-blue-500/50 dark:hover:border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.15)] transition-all duration-300"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          accept={Object.values(accept).flat().join(",")}
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] pointer-events-none opacity-40">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center relative z-10">
          <p className="font-sans font-bold text-foreground text-lg">
            {title}
          </p>
          <p className="font-sans font-normal text-muted-foreground text-sm mt-1">
            {subtitle}
          </p>
          <div className="relative w-full mt-8 max-w-xl mx-auto">
            {files.length > 0 &&
              files.map((file, idx) => (
                <motion.div
                  key={"file-select-" + idx}
                  layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                  className={cn(
                    "relative overflow-hidden z-40 bg-background/90 backdrop-blur-md flex flex-col items-start justify-start p-4 mt-4 w-full mx-auto rounded-xl",
                    "shadow-lg border border-blue-500/40 text-foreground"
                  )}
                >
                  <div className="flex justify-between w-full items-center gap-4">
                    <div className="flex items-center gap-3 truncate">
                      <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                        className="text-base text-foreground truncate max-w-xs font-semibold"
                      >
                        {file.name}
                      </motion.p>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                        className="rounded-lg px-2.5 py-1 text-xs text-muted-foreground border border-blue-500/20 bg-blue-500/5 font-mono"
                      >
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </motion.p>
                      <button
                        onClick={(e) => handleRemoveFile(e, idx)}
                        className="p-1 rounded-full hover:bg-white/10 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-3 justify-between text-muted-foreground">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="px-2 py-0.5 rounded text-[11px] bg-blue-500/10 text-blue-400 font-mono font-medium border border-blue-500/20"
                    >
                      PDF Document
                    </motion.p>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="text-[11px] text-muted-foreground font-mono"
                    >
                      Modified {new Date(file.lastModified).toLocaleDateString()}
                    </motion.p>
                  </div>
                </motion.div>
              ))}

            {!files.length && (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className={cn(
                  "relative z-40 bg-card/80 backdrop-blur-md flex items-center justify-center h-28 mt-4 w-full max-w-[8rem] mx-auto rounded-2xl shadow-xl border border-blue-500/30 group-hover/file:border-blue-400/80 transition-colors"
                )}
              >
                {isDragActive ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-blue-400 flex flex-col items-center text-xs font-medium"
                  >
                    Drop it here
                    <Upload className="h-5 w-5 text-blue-400 mt-1 animate-bounce" />
                  </motion.div>
                ) : (
                  <Upload className="h-7 w-7 text-blue-400/80 group-hover/file:text-blue-400 transition-colors" />
                )}
              </motion.div>
            )}

            {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className="absolute opacity-0 border border-dashed border-blue-500 inset-0 z-30 bg-transparent flex items-center justify-center h-28 mt-4 w-full max-w-[8rem] mx-auto rounded-2xl"
              ></motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-transparent flex-shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex-shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-white/[0.02]"
                  : "bg-white/[0.04] shadow-[0px_0px_1px_1px_rgba(255,255,255,0.05)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}
