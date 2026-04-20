// src/components/modals/BlockManagementModal.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, Package, AlertCircle, Edit2, CheckCircle, XCircle,
  Layers, Users, ChevronDown, ChevronUp, Loader2, FolderTree, MoveRight
} from 'lucide-react';

const BlockManagementModal = ({
  isOpen,
  onClose,
  blocks = [],
  pens = [],
  onCreateBlock,
  onUpdateBlock,
  onDeleteBlock,
  onAssignPensToBlock,
  onRemovePenFromBlock,
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

  // Helper: get pens not assigned to any block
  const ungroupedPens = pens.filter(pen => !pen.block_id);

  // Helper: get pens belonging to a specific block
  const getPensInBlock = (blockId) => pens.filter(pen => pen.block_id === blockId);

  // Calculate total birds in a block
  const getTotalBirdsInBlock = (blockId) => {
    const blockPens = getPensInBlock(blockId);
    return blockPens.reduce((sum, pen) => sum + (pen.current_birds || pen.initial_birds || 0), 0);
  };

  const handleCreateBlock = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmed = blockName.trim();
    if (!trimmed) {
      setError('Block name cannot be empty');
      return;
    }
    if (blocks.some(b => b.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Block already exists');
      return;
    }

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
    if (!trimmed) {
      setError('Block name cannot be empty');
      return;
    }
    if (blocks.some(b => b.id !== block.id && b.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Block name already exists');
      return;
    }

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
    if (selectedPenIds.length === 0) {
      setError('Select at least one pen to add');
      return;
    }

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
    if (selectedPenIds.length === allIds.length && allIds.length > 0) {
      setSelectedPenIds([]);
    } else {
      setSelectedPenIds(allIds);
    }
  };

  const handleClose = () => {
    setSelectedPenIds([]);
    setSelectingForBlockId(null);
    setExpandedBlockId(null);
    setEditingId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <FolderTree size={24} className="text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Manage Blocks & Pens
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {blocks.length} blocks, {pens.length} pens total
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Create Block Form */}
            <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Create New Block
              </h3>
              <form onSubmit={handleCreateBlock} className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={blockName}
                      onChange={(e) => {
                        setBlockName(e.target.value);
                        setError('');
                      }}
                      placeholder="e.g., Block A, House 1"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting || isLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading || !blockName.trim()}
                    className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting || isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Add Block
                  </button>
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200">
                    <AlertCircle size={16} className="text-red-500" />
                    <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200">
                    <CheckCircle size={16} className="text-green-500" />
                    <p className="text-sm text-green-700 dark:text-green-200">{success}</p>
                  </div>
                )}
              </form>
            </div>

            {/* Existing Blocks */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Existing Blocks
              </h3>
              {blocks.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {blocks.map((block) => {
                    const blockPens = getPensInBlock(block.id);
                    const totalBirds = getTotalBirdsInBlock(block.id);
                    const isEditing = editingId === block.id;
                    const isExpanded = expandedBlockId === block.id;
                    const isSelecting = selectingForBlockId === block.id;

                    return (
                      <div key={block.id} className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 border-b border-gray-200 dark:border-gray-700">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-1.5 text-sm"
                                autoFocus
                              />
                              <button onClick={() => handleSaveEdit(block)} disabled={isSubmitting} className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200">
                                <CheckCircle size={16} />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-gray-200 text-gray-600">
                                <XCircle size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <FolderTree size={18} className="text-blue-500" />
                                  <p className="text-lg font-bold text-gray-900 dark:text-white">{block.name}</p>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {blockPens.length} {blockPens.length === 1 ? 'pen' : 'pens'}
                                  </span>
                                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                                    <Users size={14} /> {totalBirds.toLocaleString()} birds
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => setExpandedBlockId(isExpanded ? null : block.id)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-200">
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                <button onClick={() => handleEditBlock(block)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDeleteBlock(block)} disabled={isSubmitting} className="p-2 rounded-lg text-red-500 hover:bg-red-50">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-200 dark:border-gray-700">
                            <div className="p-4 space-y-3">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                                <Layers size={14} /> Pens in this block
                              </h4>
                              {blockPens.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {blockPens.map((pen) => (
                                    <div key={pen.id} className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{pen.name}</p>
                                          <p className="text-xs text-gray-500">{(pen.current_birds || pen.initial_birds || 0).toLocaleString()} birds</p>
                                        </div>
                                      </div>
                                      <button onClick={() => handleRemovePenFromBlock(pen.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 text-center py-3 italic">No pens in this block yet</p>
                              )}
                            </div>

                            {ungroupedPens.length > 0 && (
                              <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3 bg-gray-50 dark:bg-gray-900/30">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                                    <Plus size={14} /> Add ungrouped pens
                                  </h4>
                                  <button
                                    onClick={() => {
                                      if (isSelecting) {
                                        setSelectingForBlockId(null);
                                        setSelectedPenIds([]);
                                      } else {
                                        setSelectingForBlockId(block.id);
                                      }
                                    }}
                                    className={`px-3 py-1 text-xs font-medium rounded-lg ${
                                      isSelecting ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700'
                                    }`}
                                  >
                                    {isSelecting ? 'Cancel' : 'Select pens'}
                                  </button>
                                </div>

                                {isSelecting ? (
                                  <>
                                    <div className="flex justify-between items-center">
                                      <button onClick={toggleSelectAllUngrouped} className="text-xs text-blue-600 hover:underline">
                                        {selectedPenIds.length === ungroupedPens.length && ungroupedPens.length > 0 ? 'Deselect All' : 'Select All'}
                                      </button>
                                      <span className="text-xs text-gray-500">{selectedPenIds.length} selected</span>
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                      {ungroupedPens.map((pen) => (
                                        <label key={pen.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={selectedPenIds.includes(pen.id)}
                                            onChange={() => togglePenSelection(pen.id)}
                                            className="rounded border-gray-300 text-blue-600"
                                          />
                                          <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{pen.name}</p>
                                            <p className="text-xs text-gray-500">{(pen.current_birds || pen.initial_birds || 0).toLocaleString()} birds</p>
                                          </div>
                                        </label>
                                      ))}
                                    </div>
                                    <button
                                      onClick={() => handleAddPensToBlock(block.id)}
                                      disabled={selectedPenIds.length === 0 || isSubmitting}
                                      className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <MoveRight size={16} />}
                                      Add {selectedPenIds.length} pen{selectedPenIds.length !== 1 ? 's' : ''}
                                    </button>
                                  </>
                                ) : (
                                  <p className="text-xs text-gray-600">{ungroupedPens.length} pen(s) not assigned to any block</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed text-center">
                  <Package size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">No blocks created yet</p>
                  <p className="text-sm text-gray-500 mt-1">Create your first block above</p>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 flex justify-end">
            <button onClick={handleClose} className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 hover:bg-gray-50">
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BlockManagementModal;