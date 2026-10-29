import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/$/, '')

const money = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const emptyForm = {
  foodId: '',
  name: '',
  category: 'Món nước',
  cuisine: 'Viet Nam',
  ingredients: '',
  description: '',
  price: '',
  quantity: '',
  imageUrl: '',
}

const fallbackImage =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=85'

function App() {
  const [foods, setFoods] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Tất cả')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingFood, setEditingFood] = useState(null)
  const [notice, setNotice] = useState('')
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  async function loadFoods() {
    try {
      setLoading(true)
      setApiError('')

      const response = await fetch(`${API_URL}/foods`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Không thể tải danh sách món ăn.')
      }

      setFoods(Array.isArray(data) ? data : [])
    } catch (error) {
      setApiError(
        error.message || 'Không thể kết nối Backend. Hãy kiểm tra máy chủ.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFoods()
  }, [])

  const categories = [
    'Tất cả',
    ...new Set(foods.map((food) => food.category).filter(Boolean)),
  ]

  const filteredFoods = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return foods.filter((food) => {
      const matchesSearch =
        `${food.name || ''} ${food.foodId || ''} ${food.category || ''}`
          .toLowerCase()
          .includes(keyword)

      const matchesCategory =
        category === 'Tất cả' || food.category === category

      return matchesSearch && matchesCategory
    })
  }, [foods, search, category])

  const lowStock = foods.filter(
    (food) => Number(food.quantity) < 10,
  ).length

  function openAddModal() {
    setEditingFood(null)
    setForm({ ...emptyForm })
    setNotice('')
    setApiError('')
    setModalOpen(true)
  }

  function openEditModal(food) {
    setEditingFood(food)
    setForm({
      foodId: food.foodId || '',
      name: food.name || '',
      category: food.category || 'Món nước',
      cuisine: food.cuisine || 'Viet Nam',
      ingredients: Array.isArray(food.ingredients)
        ? food.ingredients.join(', ')
        : '',
      description: food.description || '',
      price: String(food.price ?? ''),
      quantity: String(food.quantity ?? ''),
      imageUrl: food.imageUrl || '',
    })
    setNotice('')
    setApiError('')
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setNotice('')
    setApiError('')

    const price = Number(form.price)
    const quantity = Number(form.quantity)

    if (!form.name.trim()) {
      setApiError('Vui lòng nhập tên món ăn.')
      return
    }

    if (
      form.price === '' ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setApiError('Giá bán phải là số không âm.')
      return
    }

    if (
      form.quantity === '' ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      setApiError('Số lượng phải là số nguyên không âm.')
      return
    }

    const foodId =
      form.foodId.trim() ||
      editingFood?.foodId ||
      `F${Date.now().toString().slice(-8)}`

    const payload = {
      foodId,
      name: form.name.trim(),
      category: form.category.trim(),
      cuisine: form.cuisine.trim() || 'Viet Nam',
      ingredients: form.ingredients
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      price,
      quantity,
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
    }

    try {
      setSaving(true)

      const isEditing = Boolean(editingFood)
      const url = isEditing
        ? `${API_URL}/foods/${encodeURIComponent(editingFood.foodId)}`
        : `${API_URL}/foods`

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Không thể lưu món ăn.')
      }

      if (isEditing) {
        setFoods((current) =>
          current.map((food) =>
            food.foodId === editingFood.foodId ? result : food,
          ),
        )
        setNotice('Đã cập nhật món ăn thành công.')
      } else {
        setFoods((current) => [result, ...current])
        setNotice('Đã thêm món ăn vào MongoDB Atlas.')
      }

      setModalOpen(false)
    } catch (error) {
      setApiError(error.message || 'Không thể lưu món ăn.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteFood(food) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa "${food.name}" không?`,
    )

    if (!confirmed) return

    setNotice('')
    setApiError('')

    try {
      const response = await fetch(
        `${API_URL}/foods/${encodeURIComponent(food.foodId)}`,
        { method: 'DELETE' },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Không thể xóa món ăn.')
      }

      setFoods((current) =>
        current.filter((item) => item.foodId !== food.foodId),
      )
      setNotice(`Đã xóa món "${food.name}" khỏi MongoDB Atlas.`)
    } catch (error) {
      setApiError(error.message || 'Không thể xóa món ăn.')
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top">
          <span className="brand-mark">b.</span>
          <span>
            Bếp Nhà
            <small>FOOD MANAGEMENT</small>
          </span>
        </a>

        <div className="nav-label">MENU CHÍNH</div>

        <nav className="nav-menu">
          <a className="nav-item" href="#overview">
            <span>▦</span> Tổng quan
          </a>
          <a className="nav-item active" href="#foods">
            <span>♨</span> Quản lý món ăn
          </a>
          <a className="nav-item" href="#categories">
            <span>▤</span> Danh mục
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon">✦</span>
            <strong>Góc bếp gọn gàng</strong>
            <p>Quản lý thực đơn dễ dàng, mỗi ngày.</p>
          </div>

          <div className="profile">
            <div className="avatar">TN</div>
            <div>
              <strong>Quản trị viên</strong>
              <small>Food Admin</small>
            </div>
            <span className="profile-dots">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="top">
        <header className="topbar">
          <div className="breadcrumb">
            Trang chủ <span>/</span> <strong>Món ăn</strong>
          </div>
          <div className="topbar-right">
            <span className="online-dot" /> Hệ thống quản lý
            <div className="top-avatar">TN</div>
          </div>
        </header>

        <section className="page-heading" id="overview">
          <div>
            <div className="eyebrow">
              <span /> QUẢN LÝ THỰC ĐƠN
            </div>
            <h1>
              Món ăn của bạn<span>.</span>
            </h1>
            <p>Quản lý thực đơn, giá bán và số lượng món ăn tại một nơi.</p>
          </div>

          <button className="add-button" onClick={openAddModal}>
            <span>＋</span> Thêm món ăn
          </button>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-top">
              <span>Tổng món ăn</span>
              <span className="stat-icon green">♨</span>
            </div>
            <div className="stat-number">
              {foods.length.toString().padStart(2, '0')}
            </div>
            <div className="stat-foot">
              <span className="trend">↗</span> Món ăn trong thực đơn
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Đang kinh doanh</span>
              <span className="stat-icon orange">✓</span>
            </div>
            <div className="stat-number">
              {foods.filter((food) => food.quantity > 0).length
                .toString()
                .padStart(2, '0')}
            </div>
            <div className="stat-foot">Món có sẵn trong kho</div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Sắp hết hàng</span>
              <span className="stat-icon red">!</span>
            </div>
            <div className="stat-number">
              {lowStock.toString().padStart(2, '0')}
            </div>
            <div className="stat-foot">Còn dưới 10 phần</div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Danh mục</span>
              <span className="stat-icon purple">▤</span>
            </div>
            <div className="stat-number">
              {new Set(foods.map((food) => food.category)).size
                .toString()
                .padStart(2, '0')}
            </div>
            <div className="stat-foot">Nhóm món ăn khác nhau</div>
          </article>
        </section>

        <section className="menu-section" id="foods">
          <div className="section-heading">
            <div>
              <h2>Danh sách món ăn</h2>
              <p>Danh sách các món trong thực đơn của bạn.</p>
            </div>
            <span className="result-count">
              {filteredFoods.length} món ăn
            </span>
          </div>

          <div className="filter-bar">
            <label className="search-box">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tên hoặc mã món ăn..."
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Xóa tìm kiếm"
                >
                  ×
                </button>
              )}
            </label>

            <label className="category-select" id="categories">
              <span>Danh mục:</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {notice && (
            <div className="notice" role="status">
              <span>✓</span>
              {notice}
              <button onClick={() => setNotice('')} aria-label="Đóng thông báo">
                ×
              </button>
            </div>
          )}

          {apiError && (
            <div className="api-error" role="alert">
              <span>{apiError}</span>
              <button type="button" onClick={loadFoods}>
                Thử lại
              </button>
            </div>
          )}

          {loading ? (
            <div className="empty-state">
              <div>⌛</div>
              <h3>Đang tải thực đơn...</h3>
              <p>Đang lấy dữ liệu từ Backend và MongoDB Atlas.</p>
            </div>
          ) : filteredFoods.length > 0 ? (
            <div className="food-grid">
              {filteredFoods.map((food) => (
                <article className="food-card" key={food.foodId}>
                  <div className="food-image-wrap">
                    <img
                      className="food-image"
                      src={food.imageUrl || fallbackImage}
                      alt={food.name}
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = fallbackImage
                      }}
                    />
                    <span className="food-category">{food.category}</span>
                    <span
                      className={`stock-badge ${
                        food.quantity < 10 ? 'low' : ''
                      }`}
                    >
                      {food.quantity > 0
                        ? `${food.quantity} phần`
                        : 'Hết hàng'}
                    </span>
                  </div>

                  <div className="food-card-body">
                    <div className="food-id">{food.foodId}</div>
                    <h3>{food.name}</h3>
                    <p className="food-description">
                      {food.description ||
                        'Món ăn thơm ngon trong thực đơn.'}
                    </p>

                    <div className="food-card-footer">
                      <div className="food-price">
                        {money(food.price)}
                        <small>/ phần</small>
                      </div>
                      <div className="card-actions">
                        <button
                          className="icon-button edit"
                          title="Sửa món ăn"
                          aria-label={`Sửa ${food.name}`}
                          onClick={() => openEditModal(food)}
                        >
                          ✎
                        </button>
                        <button
                          className="icon-button delete"
                          title="Xóa món ăn"
                          aria-label={`Xóa ${food.name}`}
                          onClick={() => deleteFood(food)}
                        >
                          ⌫
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div>⌕</div>
              <h3>Không tìm thấy món ăn</h3>
              <p>Thử thay đổi từ khóa hoặc chọn danh mục khác.</p>
              <button
                className="secondary-button"
                onClick={() => {
                  setSearch('')
                  setCategory('Tất cả')
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </section>

        <footer className="app-footer">
          <span>© 2026 Bếp Nhà · Food Management System</span>
          <span>
            Made with <b>♥</b> for good food
          </span>
        </footer>
      </main>

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false)
            }
          }}
        >
          <section
            className="food-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  <span /> THÔNG TIN THỰC ĐƠN
                </div>
                <h2 id="modal-title">
                  {editingFood ? 'Cập nhật món ăn' : 'Thêm món ăn mới'}
                </h2>
              </div>
              <button
                className="modal-close"
                type="button"
                disabled={saving}
                onClick={() => setModalOpen(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {!editingFood && (
                <label>
                  Mã món ăn
                  <input
                    value={form.foodId}
                    onChange={(event) =>
                      setForm({ ...form, foodId: event.target.value })
                    }
                    placeholder="Để trống để tạo tự động"
                  />
                </label>
              )}

              <label>
                Tên món ăn *
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Ví dụ: Phở bò truyền thống"
                />
              </label>

              <label>
                Danh mục *
                <select
                  required
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                >
                  <option>Món nước</option>
                  <option>Cơm</option>
                  <option>Món chính</option>
                  <option>Tráng miệng</option>
                  <option>Đồ uống</option>
                </select>
              </label>

              <label>
                Ẩm thực
                <input
                  value={form.cuisine}
                  onChange={(event) =>
                    setForm({ ...form, cuisine: event.target.value })
                  }
                  placeholder="Ví dụ: Viet Nam"
                />
              </label>

              <label>
                Nguyên liệu
                <input
                  value={form.ingredients}
                  onChange={(event) =>
                    setForm({ ...form, ingredients: event.target.value })
                  }
                  placeholder="Bánh phở, thịt bò, hành"
                />
              </label>

              <label>
                Mô tả
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Mô tả ngắn về món ăn..."
                />
              </label>

              <div className="form-row">
                <label>
                  Giá bán (VNĐ) *
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.price}
                    onChange={(event) =>
                      setForm({ ...form, price: event.target.value })
                    }
                    placeholder="50000"
                  />
                </label>

                <label>
                  Số lượng *
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantity}
                    onChange={(event) =>
                      setForm({ ...form, quantity: event.target.value })
                    }
                    placeholder="20"
                  />
                </label>
              </div>

              <label>
                Đường dẫn hình ảnh
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(event) =>
                    setForm({ ...form, imageUrl: event.target.value })
                  }
                  placeholder="https://..."
                />
              </label>

              {apiError && (
                <div className="api-error" role="alert">
                  {apiError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="add-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Đang lưu...'
                    : editingFood
                      ? 'Lưu thay đổi'
                      : '＋ Thêm món ăn'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App