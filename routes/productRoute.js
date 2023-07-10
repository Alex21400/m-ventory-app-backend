const express = require('express')
const router = express.Router()
const protect = require('../middleware/authMiddleware')
const { upload } = require('../utils/fileUpload')

const { createProduct, getAllProducts, getSingleProduct, deleteProduct, updateProduct } = require('../controllers/productController')

router.get('/', protect, getAllProducts)
router.post('/', protect, upload.single('image'), createProduct)
router.get('/:id', protect, getSingleProduct)
router.delete('/:id', protect, deleteProduct)
router.patch('/:id', protect, upload.single('image'), updateProduct)

module.exports = router