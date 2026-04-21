// src/components/modals/BlockManagementModal.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, Package, AlertCircle, Edit2, CheckCircle, XCircle,
  Layers, Users, ChevronDown, ChevronUp, Loader2, FolderTree, MoveRight
} from 'lucide-react';

const BlockManagementModal = ({
  blocks = [],
  pens = [],
  onCreateBlock,
  onUpdateBlock,
  onDeleteBlock,
  onAssignPensToBlock,
  onRemovePenFromBlock,
  onClose,
  isLoading = false,
}) => {
  const [blockName, setBlockName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [expandedBlockId, setExpandedBlockId] = useState(null);
  const [selectingForBlockId, setSelectingForBlockId] = useState(null);
  const [selectedPenIds, setSelectedPenIds] = useState([]);

  const ungroupedPens = pens.filter(pen => !pen.block_id);
  const getPensInBlock = (blockId) => pens.filter(pen => pen.block_id === blockId);
  const getTotalBirdsInBlock = (blockId) => {
    const blockPens = getPensInBlock(blockId);
    return blockPens.reduce((sum, pen) => sum + (pen.current_birds || pen.initial_birds || 0), 0);
  };

  const handleCreateBlock = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const trimmed = blockName.trim();
    if (!trimmed) return setError('Block name cannot be empty');
    if (blocks.some(b => b.name.toLowerCase() === trimmed.toLowerCase())) return setError('Block already exists');
    try {
      setIsSubmitting(true);
      await onCreateBlock(trimmed);
      setSuccess(`Block "${trimmed}" created`);
      setBlockName('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to create block');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBlock = (block) => {
    setEditingId(block.id);
    setEditingName(block.name);
    setError('');
  };

  const handleSaveEdit = async (block) => {
    const trimmed = editingName.trim();
    if (!trimmed) return setError('Block name cannot be empty');
    if (blocks.some(b => b.id !== block.id && b.name.toLowerCase() === trimmed.toLowerCase())) return setError('Block name already exists');
    try {
      setIsSubmitting(true);
      await onUpdateBlock(block.id, trimmed);
      setSuccess(`Block renamed to "${trimmed}"`);
      setTimeout(() => setSuccess(''), 3000);
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      setError(err?.message || 'Failed to update block');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBlock = async (block) => {
    const pensInBlock = getPensInBlock(block.id);
    const msg = pensInBlock.length
      ? `Delete block "${block.name}"? (${pensInBlock.length} pen(s) will become ungrouped)`
      : `Delete block "${block.name}"? This action cannot be undone.`;
    if (!window.confirm(msg)) return;
    try {
      setIsSubmitting(true);
      await onDeleteBlock(block.id);
      setSuccess(`Block "${block.name}" deleted`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to delete block');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPensToBlock = async (blockId) => {
    if (selectedPenIds.length === 0) return setError('Select at least one pen to add');
    try {
      setIsSubmitting(true);
      await onAssignPensToBlock(blockId, selectedPenIds);
      setSuccess(`${selectedPenIds.length} pen(s) added to block`);
      setSelectedPenIds([]);
      setSelectingForBlockId(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to add pens');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePenFromBlock = async (penId) => {
    if (!window.confirm('Remove this pen from its block?')) return;
    try {
      setIsSubmitting(true);
      await onRemovePenFromBlock(penId);
      setSuccess('Pen removed from block');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to remove pen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePenSelection = (penId) => {
    setSelectedPenIds(prev =>
      prev.includes(penId) ? prev.filter(id => id !== penId) : [...prev, penId]
    );
  };

  const toggleSelectAllUngrouped = () => {
    const allIds = ungroupedPens.map(p => p.id);
    setSelectedPenIds(prev => (prev.length === allIds.length && allIds.length > 0) ? [] : allIds);
  };

  const handleClose = () => {
    setSelectedPenIds([]);
    setSelectingForBlockId(null);
    setExpandedBlockId(null);
    setEditingId(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 md:p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700 px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center gap-2 md:gap-3">
              <FolderTree size={20} className="md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">Manage Blocks & Pens</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">{blocks.length} blocks, {pens.length} pens total</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X size={20} className="md:w-6 md:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 space-y-5 md:space-y-6">
            {/* Create Block Form */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3">Create New Block</h3>
              <form onSubmit={handleCreateBlock} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={blockName}
                      onChange={(e) => { setBlockName(e.target.value); setError(''); }}
                      placeholder="e.g., Block A, House 1"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting || isLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading || !blockName.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting || isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Add Block
                  </button>
                </div>
                {error && <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 text-red-700 text-sm"><AlertCircle size={16} />{error}</div>}
                {success && <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 text-green-700 text-sm"><CheckCircle size={16} />{success}</div>}
              </form>
            </div>

            {/* Existing Blocks */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3">Existing Blocks</h3>
              {blocks.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {blocks.map(block => {
                    const blockPens = getPensInBlock(block.id);
                    const totalBirds = getTotalBirdsInBlock(block.id);
                    const isEditing = editingId === block.id;
                    const isExpanded = expandedBlockId === block.id;
                    const isSelecting = selectingForBlockId === block.id;

                    return (
                      <div key={block.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                        {/* Block header */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} className="flex-1 rounded-lg border px-3 py-1 text-sm" autoFocus />
                              <button onClick={() => handleSaveEdit(block)} className="p-1 text-green-600"><CheckCircle size={18} /></button>
                              <button onClick={() => setEditingId(null)} className="p-1 text-gray-500"><XCircle size={18} /></button>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <FolderTree size={16} className="text-blue-500" />
                                  <p className="font-bold text-gray-900 dark:text-white">{block.name}</p>
                                </div>
                                <div className="flex flex-wrap gap-3 mt-1 text-xs">
                                  <span className="text-gray-500">{blockPens.length} {blockPens.length === 1 ? 'pen' : 'pens'}</span>
                                  <span className="flex items-center gap-1 text-blue-600"><Users size={12} />{totalBirds.toLocaleString()} birds</span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => setExpandedBlockId(isExpanded ? null : block.id)} className="p-1 text-gray-500"><ChevronDown size={18} className={isExpanded ? 'rotate-180' : ''} /></button>
                                <button onClick={() => handleEditBlock(block)} className="p-1 text-blue-500"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteBlock(block)} className="p-1 text-red-500"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Expandable content */}
                        {isExpanded && (
                          <div className="p-3 space-y-3">
                            {/* Pens in block */}
                            <div>
                              <h4 className="text-sm font-semibold flex items-center gap-1"><Layers size={14} /> Pens in this block</h4>
                              {blockPens.length > 0 ? (
                                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                                  {blockPens.map(pen => (
                                    <div key={pen.id} className="flex justify-between items-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                      <div>
                                        <p className="text-sm font-medium">{pen.name}</p>
                                        <p className="text-xs text-gray-500">{(pen.current_birds || pen.initial_birds || 0).toLocaleString()} birds</p>
                                      </div>
                                      <button onClick={() => handleRemovePenFromBlock(pen.id)} className="p-1 text-red-500"><X size={14} /></button>
                                    </div>
                                  ))}
                                </div>
                              ) : <p className="text-sm text-gray-500 italic">No pens in this block</p>}
                            </div>

                            {/* Add ungrouped pens */}
                            {ungroupedPens.length > 0 && (
                              <div className="border-t pt-3">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-sm font-semibold"><Plus size={14} className="inline mr-1" /> Add ungrouped pens</h4>
                                  <button onClick={() => { if (isSelecting) { setSelectingForBlockId(null); setSelectedPenIds([]); } else setSelectingForBlockId(block.id); }} className="px-2 py-1 text-xs rounded bg-gray-200">{isSelecting ? 'Cancel' : 'Select'}</button>
                                </div>
                                {isSelecting && (
                                  <div className="mt-2 space-y-2">
                                    <div className="flex justify-between text-xs">
                                      <button onClick={toggleSelectAllUngrouped} className="text-blue-600">Select All</button>
                                      <span>{selectedPenIds.length} selected</span>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto space-y-2">
                                      {ungroupedPens.map(pen => (
                                        <label key={pen.id} className="flex items-center gap-2 p-1 cursor-pointer">
                                          <input type="checkbox" checked={selectedPenIds.includes(pen.id)} onChange={() => togglePenSelection(pen.id)} />
                                          <span className="text-sm">{pen.name}</span>
                                          <span className="text-xs text-gray-500">({(pen.current_birds || pen.initial_birds || 0).toLocaleString()} birds)</span>
                                        </label>
                                      ))}
                                    </div>
                                    <button onClick={() => handleAddPensToBlock(block.id)} disabled={selectedPenIds.length === 0 || isSubmitting} className="w-full mt-2 bg-green-600 text-white py-1.5 rounded text-sm flex items-center justify-center gap-1">
                                      {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <MoveRight size={14} />}
                                      Add {selectedPenIds.length} pen{selectedPenIds.length !== 1 ? 's' : ''}
                                    </button>
                                  </div>
                                )}
                                {!isSelecting && <p className="text-xs text-gray-500 mt-1">{ungroupedPens.length} pen(s) unassigned</p>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl border-2 border-dashed bg-gray-50 dark:bg-gray-800/30">
                  <Package size={40} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">No blocks yet</p>
                  <p className="text-sm text-gray-500">Create your first block above</p>
                </div>
              )}
            </div>

            {/* Tip */}
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 text-xs text-gray-600">
              <strong>💡 Tip:</strong> Expand a block, click <strong>Select</strong> to choose pens, then <strong>Add</strong>. Pens can be removed anytime.
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t bg-white dark:bg-gray-900 p-3 flex justify-end">
            <button onClick={handleClose} className="rounded-lg border px-4 py-1.5 text-sm">Close</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BlockManagementModal;