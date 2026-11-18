import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

void main() {
  runApp(const TotemKioskApp());
}

class TotemKioskApp extends StatelessWidget {
  const TotemKioskApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mango Brasil - Totem de Autoatendimento',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF102A20),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFF6BC36),
          secondary: Color(0xFF10B981),
          surface: Color(0xFF193B2D),
        ),
        fontFamily: 'sans-serif',
      ),
      home: const KioskMainScreen(),
    );
  }
}

class CartItem {
  final String productId;
  final String productName;
  final double unitPrice;
  int quantity;
  final String? sizeName;
  final List<String> additionsNames;
  final double totalPrice;

  CartItem({
    required this.productId,
    required this.productName,
    required this.unitPrice,
    required this.quantity,
    this.sizeName,
    required this.additionsNames,
    required this.totalPrice,
  });
}

class KioskMainScreen extends StatefulWidget {
  const KioskMainScreen({super.key});

  @override
  State<KioskMainScreen> createState() => _KioskMainScreenState();
}

class _KioskMainScreenState extends State<KioskMainScreen> {
  bool _isAttractScreen = true;
  List<dynamic> _categories = [];
  List<dynamic> _products = [];
  String? _selectedCategoryId;
  bool _isLoading = true;
  final List<CartItem> _cart = [];
  Timer? _inactivityTimer;

  final currencyFormatter = NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$');

  @override
  void initState() {
    super.initState();
    _fetchCatalog();
    _resetInactivityTimer();
  }

  void _resetInactivityTimer() {
    _inactivityTimer?.cancel();
    if (!_isAttractScreen) {
      _inactivityTimer = Timer(const Duration(seconds: 45), () {
        if (mounted && !_isAttractScreen) {
          setState(() {
            _cart.clear();
            _isAttractScreen = true;
          });
        }
      });
    }
  }

  Future<void> _fetchCatalog() async {
    try {
      final catRes = await http.get(Uri.parse('http://localhost:4000/api/categories'));
      final prodRes = await http.get(Uri.parse('http://localhost:4000/api/products?kioskOnly=true'));

      if (catRes.statusCode == 200 && prodRes.statusCode == 200) {
        final cats = jsonDecode(catRes.body);
        final prods = jsonDecode(prodRes.body);
        setState(() {
          _categories = cats;
          _products = prods;
          if (_categories.isNotEmpty) {
            _selectedCategoryId = _categories.first['id'];
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Erro ao buscar catálogo: $e');
      setState(() => _isLoading = false);
    }
  }

  double get _cartTotal => _cart.fold(0.0, (sum, item) => sum + item.totalPrice);

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => _resetInactivityTimer(),
      child: Scaffold(
        body: _isAttractScreen ? _buildAttractScreen() : _buildKioskInterface(),
      ),
    );
  }

  Widget _buildAttractScreen() {
    return GestureDetector(
      onTap: () => setState(() => _isAttractScreen = false),
      child: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF102A20), Color(0xFF071B12)],
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.eco_rounded, size: 120, color: Color(0xFFF6BC36)),
            const SizedBox(height: 24),
            const Text(
              'MANGO BRASIL',
              style: TextStyle(fontSize: 48, fontWeight: FontWeight.w900, letterSpacing: 2),
            ),
            const SizedBox(height: 8),
            const Text(
              'Mangas temperadas. Sabor de Brasil.',
              style: TextStyle(fontSize: 20, color: Color(0xFF94A3B8)),
            ),
            const SizedBox(height: 64),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 24),
              decoration: BoxDecoration(
                color: const Color(0xFFF6BC36),
                borderRadius: BorderRadius.circular(50),
                boxShadow: [
                  BoxShadow(color: const Color(0xFFF6BC36).withValues(alpha: 0.4), blurRadius: 20, spreadRadius: 4),
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.touch_app_rounded, size: 36, color: Colors.black),
                  SizedBox(width: 16),
                  Text(
                    'TOQUE NA TELA PARA PEDIR',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildKioskInterface() {
    final filteredProducts = _products.where((p) => p['categoryId'] == _selectedCategoryId).toList();

    return Row(
      children: [
        // 1. Menu Lateral de Categorias
        Container(
          width: 200,
          color: const Color(0xFF090D16),
          child: Column(
            children: [
              const SizedBox(height: 32),
              const Icon(Icons.eco_rounded, color: Color(0xFFF6BC36), size: 48),
              const SizedBox(height: 8),
              const Text('MANGO BRASIL', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 32),
              Expanded(
                child: ListView.builder(
                  itemCount: _categories.length,
                  itemBuilder: (context, index) {
                    final cat = _categories[index];
                    final isSelected = cat['id'] == _selectedCategoryId;
                    return InkWell(
                      onTap: () => setState(() => _selectedCategoryId = cat['id']),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF193B2D) : Colors.transparent,
                          border: Border(
                            left: BorderSide(
                              color: isSelected ? const Color(0xFFF6BC36) : Colors.transparent,
                              width: 6,
                            ),
                          ),
                        ),
                        child: Text(
                          cat['name'],
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            color: isSelected ? Colors.white : const Color(0xFF94A3B8),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: OutlinedButton.icon(
                  onPressed: () => setState(() {
                    _cart.clear();
                    _isAttractScreen = true;
                  }),
                  icon: const Icon(Icons.cancel_outlined, size: 20),
                  label: const Text('Cancelar'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFEF4444),
                    side: const BorderSide(color: Color(0xFFEF4444)),
                    minimumSize: const Size.fromHeight(48),
                  ),
                ),
              ),
            ],
          ),
        ),

        // 2. Grade de Produtos
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: GridView.builder(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      childAspectRatio: 0.72,
                      crossAxisSpacing: 20,
                      mainAxisSpacing: 20,
                    ),
                    itemCount: filteredProducts.length,
                    itemBuilder: (context, index) {
                      final prod = filteredProducts[index];
                      return _buildProductCard(prod);
                    },
                  ),
                ),
        ),

        // 3. Painel do Carrinho
        Container(
          width: 340,
          color: const Color(0xFF151F30),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.shopping_bag_outlined, color: Color(0xFFF6BC36), size: 28),
                  SizedBox(width: 10),
                  Text('Meu Pedido', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                ],
              ),
              const Divider(color: Color(0xFF2E5540), height: 32),
              Expanded(
                child: _cart.isEmpty
                    ? const Center(
                        child: Text(
                          'Seu carrinho está vazio.\nSelecione um item delicioso!',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 16),
                        ),
                      )
                    : ListView.separated(
                        itemCount: _cart.length,
                        separatorBuilder: (context, index) => const Divider(color: Color(0xFF243248)),
                        itemBuilder: (context, index) {
                          final item = _cart[index];
                          return Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${item.quantity}x ${item.productName}',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                    ),
                                    if (item.additionsNames.isNotEmpty)
                                      Text(
                                        item.additionsNames.join(', '),
                                        style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                                      ),
                                    const SizedBox(height: 4),
                                    Text(
                                      currencyFormatter.format(item.totalPrice),
                                      style: const TextStyle(color: Color(0xFFF6BC36), fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: Color(0xFFEF4444)),
                                onPressed: () => setState(() => _cart.removeAt(index)),
                              )
                            ],
                          );
                        },
                      ),
              ),
              const Divider(color: Color(0xFF2E5540), height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total:', style: TextStyle(fontSize: 18, color: Color(0xFF94A3B8))),
                  Text(
                    currencyFormatter.format(_cartTotal),
                    style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Color(0xFF10B981)),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _cart.isEmpty ? null : _openCheckoutModal,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text(
                    'PAGAR AGORA',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildProductCard(dynamic prod) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF193B2D),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF2E5540)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Image.network(
              Uri.parse('http://localhost:4000').resolve(prod['imageUrl'] ?? '').toString(),
              height: 140,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                height: 140,
                color: const Color(0xFF2E5540),
                child: const Icon(Icons.eco_rounded, size: 48, color: Color(0xFF94A3B8)),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  prod['name'],
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  prod['description'] ?? '',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      currencyFormatter.format(prod['basePrice']),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFF6BC36)),
                    ),
                    ElevatedButton(
                      onPressed: () => _addToCart(prod),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF6BC36),
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      ),
                      child: const Text('ADICIONAR', style: TextStyle(fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _addToCart(dynamic prod) {
    setState(() {
      _cart.add(CartItem(
        productId: prod['id'],
        productName: prod['name'],
        unitPrice: prod['basePrice'].toDouble(),
        quantity: 1,
        additionsNames: [],
        totalPrice: prod['basePrice'].toDouble(),
      ));
    });
  }

  void _openCheckoutModal() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => CheckoutDialog(
        total: _cartTotal,
        cartItems: _cart,
        onOrderFinished: () {
          setState(() => _cart.clear());
          Navigator.of(ctx).pop();
        },
      ),
    );
  }
}

class CheckoutDialog extends StatefulWidget {
  final double total;
  final List<CartItem> cartItems;
  final VoidCallback onOrderFinished;

  const CheckoutDialog({
    super.key,
    required this.total,
    required this.cartItems,
    required this.onOrderFinished,
  });

  @override
  State<CheckoutDialog> createState() => _CheckoutDialogState();
}

class _CheckoutDialogState extends State<CheckoutDialog> {
  int _step = 1; // 1 = Escolha Forma, 2 = Processando Pinpad, 3 = Sucesso & Impressão
  String _pinpadStatus = '';
  String _ticketNumber = '';
  String _nfceKey = '';
  final currencyFormatter = NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$');

  Future<void> _processPayment(String method) async {
    setState(() {
      _step = 2;
      _pinpadStatus = method == 'PIX'
          ? 'Gerando QR Code Pix dinâmico no Pinpad...'
          : 'Aproxime ou insira o cartão no Pinpad...';
    });

    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _pinpadStatus = 'Digite sua senha de 4 a 6 dígitos e aperte ENTER');
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _pinpadStatus = 'Processando autorização e emitindo NFC-e...');

    // Enviar venda para API Central Web
    try {
      final itemsPayload = widget.cartItems
          .map((i) => {
                'productId': i.productId,
                'productName': i.productName,
                'quantity': i.quantity,
                'unitPrice': i.unitPrice,
                'totalPrice': i.totalPrice,
                'additions': [],
                'fiscal': {
                  'ncm': '2106.90.90',
                  'cfop': '5.102',
                  'origem': 0,
                  'cstCsosn': '102',
                  'aliquotaIcms': 0,
                  'aliquotaIbpt': 18.45
                }
              })
          .toList();

      final body = jsonEncode({
        'items': itemsPayload,
        'payments': [
          {
            'method': method == 'PIX' ? 'PIX' : (method == 'DEBITO' ? 'DEBIT_CARD' : 'CREDIT_CARD'),
            'amount': widget.total,
            'status': 'APPROVED',
            'nsu': '847291',
            'authorizationCode': '612984'
          }
        ],
        'origin': 'TOTEM',
        'kioskId': 'totem-01'
      });

      final res = await http.post(
        Uri.parse('http://localhost:4000/api/orders'),
        headers: {'Content-Type': 'application/json'},
        body: body,
      );

      if (res.statusCode == 201) {
        final orderData = jsonDecode(res.body);
        if (mounted) {
          setState(() {
            _step = 3;
            _ticketNumber = orderData['publicTicketNumber'] ?? '042';
            _nfceKey = orderData['nfceKey'] ?? '';
          });
        }
      }
    } catch (e) {
      debugPrint('Erro ao enviar pedido: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: const Color(0xFF193B2D),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Container(
        width: 500,
        padding: const EdgeInsets.all(32),
        child: _step == 1
            ? _buildPaymentSelection()
            : (_step == 2 ? _buildPinpadProgress() : _buildSuccessScreen()),
      ),
    );
  }

  Widget _buildPaymentSelection() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text('Escolha como pagar', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text('Total: ${currencyFormatter.format(widget.total)}',
            style: const TextStyle(fontSize: 20, color: Color(0xFFF6BC36), fontWeight: FontWeight.bold)),
        const SizedBox(height: 32),
        _buildPaymentOption(
          icon: Icons.credit_card_rounded,
          title: 'Cartão de Crédito',
          subtitle: 'Aproximação ou Chip no Pinpad',
          onTap: () => _processPayment('CREDITO'),
        ),
        const SizedBox(height: 16),
        _buildPaymentOption(
          icon: Icons.payment_rounded,
          title: 'Cartão de Débito',
          subtitle: 'Débito à vista no Pinpad',
          onTap: () => _processPayment('DEBITO'),
        ),
        const SizedBox(height: 16),
        _buildPaymentOption(
          icon: Icons.qr_code_2_rounded,
          title: 'Pix no Pinpad',
          subtitle: 'QR Code instantâneo com confirmação automática',
          onTap: () => _processPayment('PIX'),
        ),
        const SizedBox(height: 24),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Voltar ao cardápio', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 16)),
        )
      ],
    );
  }

  Widget _buildPaymentOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF102A20),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF2E5540)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF6BC36).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: const Color(0xFFF6BC36), size: 30),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Color(0xFF94A3B8)),
          ],
        ),
      ),
    );
  }

  Widget _buildPinpadProgress() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 16),
        const CircularProgressIndicator(color: Color(0xFFF6BC36), strokeWidth: 5),
        const SizedBox(height: 32),
        const Text('Siga as instruções no Pinpad', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF102A20),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF2E5540)),
          ),
          child: Text(
            _pinpadStatus,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 16, color: Color(0xFFF6BC36), fontWeight: FontWeight.w600),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildSuccessScreen() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 72),
        const SizedBox(height: 16),
        const Text('Pedido Confirmado!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text('Retire seu comprovante e a NFC-e impressa abaixo.',
            textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF94A3B8))),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 20),
          decoration: BoxDecoration(
            color: const Color(0xFF102A20),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF10B981), width: 2),
          ),
          child: Column(
            children: [
              const Text('SUA SENHA:', style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8), fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(
                '#$_ticketNumber',
                style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w900, color: Color(0xFFF6BC36)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text('NFC-e Autorizada: ${_nfceKey.isEmpty ? "5026...1041" : _nfceKey.substring(0, 20)}...',
            style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
        const SizedBox(height: 28),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: widget.onOrderFinished,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFF6BC36),
              foregroundColor: Colors.black,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('FINALIZAR', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          ),
        )
      ],
    );
  }
}
