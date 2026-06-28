import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

const API_URL = 'http://192.168.88.75:3001/productos';

export default function App() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precio, setPrecio] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarCategorias, setMostrarCategorias] = useState(false);

  const cargarProductos = async () => {
    try {
      setError('');
      const respuesta = await fetch(API_URL);
      if (!respuesta.ok) {
        throw new Error('Error HTTP: ' + respuesta.status);
      }
      const datos = await respuesta.json();
      setProductos(datos);
      const categoriasUnicas = Array.from(
        new Set(datos.map((item) => (item.categoria ? item.categoria.toString() : 'Sin categoría')))
      );
      setCategorias(categoriasUnicas);
    } catch (e) {
      setError('No se pudo conectar con la API. Revise la URL, la red Wi-Fi y el servidor.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const agregarProducto = async () => {
    if (!nombre.trim() || !precio.trim() || !categoria.trim()) {
      Alert.alert('Datos incompletos', 'Ingrese nombre, precio y categoría del producto.');
      return;
    }

    const nuevoProducto = {
      id: editandoId ? editandoId : Date.now().toString(),
      nombre: nombre.trim(),
      precio: Number(precio),
      categoria: categoria.trim(),
      stock: 1,
    };

    const metodo = editandoId ? 'PUT' : 'POST';
    const url = editandoId ? `${API_URL}/${editandoId}` : API_URL;

    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoProducto),
      });

      if (!respuesta.ok) {
        throw new Error('No se pudo guardar');
      }

      setNombre('');
      setPrecio('');
      setCategoria('');
      setEditandoId(null);
      await cargarProductos();
      Alert.alert('Correcto', editandoId ? 'Producto editado correctamente.' : 'Producto registrado en la API propia.');
    } catch (e) {
      Alert.alert('Error', editandoId ? 'No se pudo editar el producto.' : 'No se pudo registrar el producto.');
    }
  };

  const iniciarEdicion = (item) => {
    setNombre(item.nombre);
    setPrecio(item.precio?.toString() ?? '');
    setCategoria(item.categoria ?? '');
    setEditandoId(item.id.toString());
  };

  const seleccionarCategoria = (cat) => {
    setCategoria(cat);
    setMostrarCategorias(false);
  };

  const cancelarEdicion = () => {
    setNombre('');
    setPrecio('');
    setCategoria('');
    setEditandoId(null);
  };

  const eliminarProducto = async (id) => {
    try {
      const respuesta = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!respuesta.ok) {
        throw new Error('No se pudo eliminar');
      }
      await cargarProductos();
      Alert.alert('Eliminado', 'Producto eliminado correctamente.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo eliminar el producto.');
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  if (cargando) {
    return (
      <SafeAreaView style={styles.centro}>
        <ActivityIndicator size="large" />
        <Text style={styles.texto}>Cargando productos desde la API...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Nube de Bebé</Text>
        <Text style={styles.subtitulo}>Ropa, juguetes y artículos de maternidad</Text>
        <Text style={styles.descripcion}>
          Encuentra todo lo que necesitas para mamá y bebé: productos suaves, seguros y llenos de ternura.
        </Text>
      </View>

      <View style={styles.formulario}>
        <TextInput
          style={styles.input}
          placeholder="Nombre del producto"
          placeholderTextColor="#9ca3af"
          value={nombre}
          onChangeText={setNombre}
        />
        <TextInput
          style={styles.input}
          placeholder="Precio"
          placeholderTextColor="#9ca3af"
          value={precio}
          onChangeText={setPrecio}
          keyboardType="decimal-pad"
        />
        <Pressable style={styles.selector} onPress={() => setMostrarCategorias(true)}>
          <Text style={styles.selectorText}>
            {categoria || 'Selecciona una categoría'}
          </Text>
          <Text style={styles.selectorArrow}>▾</Text>
        </Pressable>

        <Modal
          visible={mostrarCategorias}
          transparent
          animationType="fade"
          onRequestClose={() => setMostrarCategorias(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setMostrarCategorias(false)}>
            <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
              <Text style={styles.modalTitle}>Selecciona una categoría</Text>
              <ScrollView style={styles.modalList}>
                {categorias.length > 0 ? (
                  categorias.map((cat) => (
                    <Pressable
                      key={cat}
                      style={styles.modalItem}
                      onPress={() => seleccionarCategoria(cat)}>
                      <Text style={styles.modalItemText}>{cat}</Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.modalEmpty}>No hay categorías disponibles</Text>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <Pressable style={styles.boton} onPress={agregarProducto}>
          <Text style={styles.botonTexto}>{editandoId ? 'Guardar cambios' : 'Agregar producto'}</Text>
        </Pressable>
        {editandoId ? (
          <Pressable style={styles.cancelButton} onPress={cancelarEdicion}>
            <Text style={styles.cancelButtonText}>Cancelar edición</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={productos}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => {
              setRefrescando(true);
              cargarProductos();
            }}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <View style={styles.cardActions}>
                <Pressable style={styles.actionButton} onPress={() => iniciarEdicion(item)}>
                  <Text style={styles.actionText}>Editar</Text>
                </Pressable>
                <Pressable style={styles.deleteButton} onPress={() => eliminarProducto(item.id)}>
                  <Text style={styles.deleteText}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.categoria}>Categoría: {item.categoria}</Text>
            <Text style={styles.detalle}>Precio: ${item.precio}</Text>
            <Text style={styles.detalle}>Stock: {item.stock}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f3eeff',
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    color: '#4f2a6a',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 16,
    marginBottom: 8,
    color: '#7a5b8c',
    textAlign: 'center',
  },
  descripcion: {
    fontSize: 14,
    color: '#8f75a9',
    textAlign: 'center',
    lineHeight: 20,
    marginHorizontal: 12,
  },
  texto: {
    marginTop: 12,
    color: '#6b5b7b',
  },
  header: {
    marginBottom: 20,
    paddingVertical: 4,
  },
  formulario: {
    backgroundColor: '#fbf6ff',
    padding: 18,
    borderRadius: 20,
    marginBottom: 18,
    shadowColor: '#8b70a0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d8c8e6',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#f8f0ff',
    color: '#5b4b7a',
  },
  boton: {
    backgroundColor: '#8c5de8',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#7e5cb8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  botonTexto: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#e5d4f7',
  },
  cancelButtonText: {
    color: '#5e3b79',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 28,
  },
  selector: {
    borderWidth: 1,
    borderColor: '#d8c8e6',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#f8f0ff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    color: '#5b4b7a',
    fontSize: 15,
    flex: 1,
  },
  selectorArrow: {
    color: '#8c5de8',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(75, 47, 107, 0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    maxHeight: 320,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4b2f6b',
    marginBottom: 12,
  },
  modalList: {
    maxHeight: 240,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#efe5f8',
  },
  modalItemText: {
    color: '#5b4b7a',
    fontSize: 15,
  },
  modalEmpty: {
    color: '#8f75a9',
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#fff9ff',
    padding: 18,
    borderRadius: 22,
    marginBottom: 14,
    shadowColor: '#7f68a8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#e8d9ff',
  },
  actionText: {
    color: '#5e3b79',
    fontWeight: '700',
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#ffd8ee',
  },
  deleteText: {
    color: '#9b2c80',
    fontWeight: '700',
  },
  nombre: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 8,
    color: '#4b2f6b',
  },
  categoria: {
    color: '#6d557f',
    marginBottom: 4,
  },
  detalle: {
    color: '#6d557f',
    marginBottom: 2,
  },
  error: {
    backgroundColor: '#fde8ff',
    color: '#8f3d96',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
});

