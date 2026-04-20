// src/pages/Feed.jsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  Wheat,
  Plus,
  Trash2,
  Edit,
  Package,
  TrendingUp,
  Calendar,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Feed() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, ingredients, mixes
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);

  // --- Queries (object syntax v5) ---
  // Inventory: returns a single object, NOT an array
  const {
    data: inventory,
    isLoading: inventoryLoading,
    refetch: refetchInventory,
  } = useQuery({
    queryKey: ['feed', 'inventory'],
    queryFn: () => feedService.getInventory(),
    staleTime: 30_000,
  });

  // Ingredients: returns an array
  const {
    data: ingredients = [],
    isLoading: ingredientsLoading,
    refetch: refetchIngredients,
  } = useQuery({
    queryKey: ['feed', 'ingredients'],
    queryFn: () => feedService.getIngredients(),
    staleTime: 60_000,
  });

  // Mixes: returns an array
  const {
    data: mixes = [],
    isLoading: mixesLoading,
    refetch: refetchMixes,
  } = useQuery({
    queryKey: ['feed', 'mixes'],
    queryFn: () => feedService.getMixes(),
    staleTime: 60_000,
  });

  // --- Mutations ---
  const updateInventoryMutation = useMutation({
    mutationFn: (data) => feedService.updateInventory(data),
    onSuccess: () => {
      toast.success('Inventory updated');
      queryClient.invalidateQueries({ queryKey: ['feed', 'inventory'] });
      setIsFormOpen(false);
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Update failed'),
  });

  const createIngredientMutation = useMutation({
    mutationFn: (data) => feedService.createIngredient(data),
    onSuccess: () => {
      toast.success('Ingredient added');
      queryClient.invalidateQueries({ queryKey: ['feed', 'ingredients'] });
      setIsFormOpen(false);
      setEditingIngredient(null);
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Failed to add ingredient'),
  });

  const updateIngredientMutation = useMutation({
    mutationFn: ({ id, data }) => feedService.updateIngredient(id, data),
    onSuccess: () => {
      toast.success('Ingredient updated');
      queryClient.invalidateQueries({ queryKey: ['feed', 'ingredients'] });
      setIsFormOpen(false);
      setEditingIngredient(null);
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Update failed'),
  });

  const deleteIngredientMutation = useMutation({
    mutationFn: (id) => feedService.deleteIngredient(id),
    onSuccess: () => {
      toast.success('Ingredient deleted');
      queryClient.invalidateQueries({ queryKey: ['feed', 'ingredients'] });
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Delete failed'),
  });

  const createMixMutation = useMutation({
    mutationFn: (data) => feedService.createMix(data),
    onSuccess: () => {
      toast.success('Feed mix created');
      queryClient.invalidateQueries({ queryKey: ['feed', 'mixes'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'ingredients'] });
      setIsFormOpen(false);
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Failed to create mix'),
  });

  // Form states
  const [inventoryForm, setInventoryForm] = useState({
    feed_type: 'General',
    opening_stock: 0,
    received: 0,
    consumed: 0,
  });

  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    stock_kg: 0,
    unit_cost: 0,
  });

  const [mixForm, setMixForm] = useState({
    name: '',
    mix_date: new Date().toISOString().split('T')[0],
    items: [{ ingredient_id: '', quantity_kg: 0 }],
  });

  const handleInventorySubmit = (e) => {
    e.preventDefault();
    updateInventoryMutation.mutate(inventoryForm);
  };

  const handleIngredientSubmit = (e) => {
    e.preventDefault();
    if (editingIngredient) {
      updateIngredientMutation.mutate({ id: editingIngredient.id, data: ingredientForm });
    } else {
      createIngredientMutation.mutate(ingredientForm);
    }
  };

  const handleMixSubmit = (e) => {
    e.preventDefault();
    createMixMutation.mutate(mixForm);
  };

  const addMixItem = () => {
    setMixForm({
      ...mixForm,
      items: [...mixForm.items, { ingredient_id: '', quantity_kg: 0 }],
    });
  };

  const removeMixItem = (index) => {
    const newItems = mixForm.items.filter((_, i) => i !== index);
    setMixForm({ ...mixForm, items: newItems });
  };

  const updateMixItem = (index, field, value) => {
    const newItems = [...mixForm.items];
    newItems[index][field] = field === 'quantity_kg' ? parseFloat(value) : parseInt(value);
    setMixForm({ ...mixForm, items: newItems });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Feed Management
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage inventory, ingredients, and feed mixes
            </p>
          </div>
          <button
            onClick={() => {
              setActiveTab('inventory');
              setIsFormOpen(true);
              setInventoryForm({
                feed_type: 'General',
                opening_stock: inventory?.closing_stock || 0,
                received: 0,
                consumed: 0,
              });
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <Plus size={18} />
            Update Inventory
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-700">
          {[
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'ingredients', label: 'Ingredients', icon: Wheat },
            { id: 'mixes', label: 'Feed Mixes', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'border-b-2 border-slate-900 text-slate-900 dark:border-white dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/80">
          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div>
              {inventoryLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30">
                    <p className="text-sm text-blue-600 dark:text-blue-400">Opening Stock</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {inventory?.opening_stock?.toFixed(1) || 0} kg
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">Received</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {inventory?.received?.toFixed(1) || 0} kg
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/30">
                    <p className="text-sm text-amber-600 dark:text-amber-400">Consumed</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {inventory?.consumed?.toFixed(1) || 0} kg
                    </p>
                  </div>
                  <div className="rounded-2xl bg-violet-50 p-4 dark:bg-violet-950/30">
                    <p className="text-sm text-violet-600 dark:text-violet-400">Closing Stock</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {inventory?.closing_stock?.toFixed(1) || 0} kg
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ingredients Tab */}
          {activeTab === 'ingredients' && (
            <div>
              <div className="mb-4 flex justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Ingredients
                </h2>
                <button
                  onClick={() => {
                    setEditingIngredient(null);
                    setIngredientForm({ name: '', stock_kg: 0, unit_cost: 0 });
                    setIsFormOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-sm text-white"
                >
                  <Plus size={16} /> Add Ingredient
                </button>
              </div>

              {ingredientsLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : ingredients.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center">
                  <Wheat className="mx-auto mb-2 h-12 w-12 text-slate-400" />
                  <p className="text-slate-500">No ingredients yet. Add your first ingredient.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Stock (kg)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Unit Cost</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {ingredients.map((ing) => (
                        <tr key={ing.id}>
                          <td className="px-4 py-3 text-sm">{ing.name}</td>
                          <td className="px-4 py-3 text-sm">{ing.stock_kg.toFixed(1)}</td>
                          <td className="px-4 py-3 text-sm">${ing.unit_cost.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingIngredient(ing);
                                  setIngredientForm({
                                    name: ing.name,
                                    stock_kg: ing.stock_kg,
                                    unit_cost: ing.unit_cost,
                                  });
                                  setIsFormOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => deleteIngredientMutation.mutate(ing.id)}
                                className="text-rose-600 hover:text-rose-800"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Mixes Tab */}
          {activeTab === 'mixes' && (
            <div>
              <div className="mb-4 flex justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Feed Mixes
                </h2>
                <button
                  onClick={() => {
                    setMixForm({
                      name: '',
                      mix_date: new Date().toISOString().split('T')[0],
                      items: [{ ingredient_id: '', quantity_kg: 0 }],
                    });
                    setIsFormOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-sm text-white"
                >
                  <Plus size={16} /> Create Mix
                </button>
              </div>

              {mixesLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : mixes.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center">
                  <TrendingUp className="mx-auto mb-2 h-12 w-12 text-slate-400" />
                  <p className="text-slate-500">No feed mixes created yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mixes.map((mix) => (
                    <div
                      key={mix.id}
                      className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {mix.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} /> {new Date(mix.mix_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package size={14} /> {mix.total_kg.toFixed(1)} kg
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign size={14} /> ${mix.cost_per_kg.toFixed(2)}/kg
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Ingredients:
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {mix.mix_items?.map((item) => (
                            <span
                              key={item.id}
                              className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
                            >
                              {item.ingredient_name}: {item.quantity_kg} kg
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setIsFormOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Inventory Form */}
              {activeTab === 'inventory' && (
                <form onSubmit={handleInventorySubmit}>
                  <h2 className="mb-4 text-xl font-bold">Update Inventory</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Feed Type</label>
                      <input
                        type="text"
                        value={inventoryForm.feed_type}
                        onChange={(e) =>
                          setInventoryForm({ ...inventoryForm, feed_type: e.target.value })
                        }
                        className="w-full rounded-xl border p-2 dark:bg-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Opening Stock (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={inventoryForm.opening_stock}
                        onChange={(e) =>
                          setInventoryForm({
                            ...inventoryForm,
                            opening_stock: parseFloat(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border p-2 dark:bg-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Received (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={inventoryForm.received}
                        onChange={(e) =>
                          setInventoryForm({
                            ...inventoryForm,
                            received: parseFloat(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border p-2 dark:bg-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Consumed (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={inventoryForm.consumed}
                        onChange={(e) =>
                          setInventoryForm({
                            ...inventoryForm,
                            consumed: parseFloat(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border p-2 dark:bg-slate-800"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="rounded-xl border px-4 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateInventoryMutation.isLoading}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-white"
                    >
                      {updateInventoryMutation.isLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              )}

              {/* Ingredient Form */}
              {activeTab === 'ingredients' && (
                <form onSubmit={handleIngredientSubmit}>
                  <h2 className="mb-4 text-xl font-bold">
                    {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Name</label>
                      <input
                        type="text"
                        value={ingredientForm.name}
                        onChange={(e) =>
                          setIngredientForm({ ...ingredientForm, name: e.target.value })
                        }
                        className="w-full rounded-xl border p-2 dark:bg-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Stock (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={ingredientForm.stock_kg}
                        onChange={(e) =>
                          setIngredientForm({
                            ...ingredientForm,
                            stock_kg: parseFloat(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border p-2 dark:bg-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Unit Cost ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ingredientForm.unit_cost}
                        onChange={(e) =>
                          setIngredientForm({
                            ...ingredientForm,
                            unit_cost: parseFloat(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border p-2 dark:bg-slate-800"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="rounded-xl border px-4 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createIngredientMutation.isLoading || updateIngredientMutation.isLoading}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-white"
                    >
                      {editingIngredient ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              )}

              {/* Mix Form */}
              {activeTab === 'mixes' && (
                <form onSubmit={handleMixSubmit}>
                  <h2 className="mb-4 text-xl font-bold">Create Feed Mix</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Mix Name</label>
                      <input
                        type="text"
                        value={mixForm.name}
                        onChange={(e) => setMixForm({ ...mixForm, name: e.target.value })}
                        className="w-full rounded-xl border p-2 dark:bg-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Mix Date</label>
                      <input
                        type="date"
                        value={mixForm.mix_date}
                        onChange={(e) => setMixForm({ ...mixForm, mix_date: e.target.value })}
                        className="w-full rounded-xl border p-2 dark:bg-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Ingredients</label>
                      {mixForm.items.map((item, idx) => (
                        <div key={idx} className="mb-2 flex gap-2">
                          <select
                            value={item.ingredient_id}
                            onChange={(e) =>
                              updateMixItem(idx, 'ingredient_id', e.target.value)
                            }
                            className="flex-1 rounded-xl border p-2 dark:bg-slate-800"
                            required
                          >
                            <option value="">Select ingredient</option>
                            {ingredients.map((ing) => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name} (stock: {ing.stock_kg.toFixed(1)} kg)
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="kg"
                            value={item.quantity_kg}
                            onChange={(e) =>
                              updateMixItem(idx, 'quantity_kg', e.target.value)
                            }
                            className="w-32 rounded-xl border p-2 dark:bg-slate-800"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => removeMixItem(idx)}
                            className="rounded-xl bg-rose-100 p-2 text-rose-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addMixItem}
                        className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600"
                      >
                        <Plus size={14} /> Add ingredient
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="rounded-xl border px-4 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMixMutation.isLoading}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-white"
                    >
                      {createMixMutation.isLoading ? 'Creating...' : 'Create Mix'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}